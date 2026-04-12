"""
RoadGuard-AI — Production FastAPI Backend
=========================================
Endpoints:
  POST /api/predict              — sensor-only inference
  POST /api/predict-multimodal   — sensor + image fusion
  POST /api/predict-batch        — batch processing
  POST /api/predict-video-frame  — base64 image frame only (vision pipeline)
  GET  /api/events               — paginated hazard events
  GET  /api/events/stats         — aggregated statistics
  GET  /api/health               — system health
  WS   /ws/events                — real-time event stream
"""
import asyncio
import base64
import io
import logging
import time
from datetime import datetime, timedelta
from typing import List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import admin modules
from database import init_db, close_db
from routes import router as admin_router

YOLO_MODEL_PATH = "../models/best.pt"
STAGE1_MODEL = "../models/stage1_binary_v2.keras"
STAGE2_MODEL = "../models/stage2_subtype_v2.keras"

stage1_model = None
stage2_model = None
yolo_model = None
PRODUCTION = False

YOLO_MODEL_PATH = "../models/best.pt"
STAGE1_MODEL = "../models/stage1_binary_v2.keras"
STAGE2_MODEL = "../models/stage2_subtype_v2.keras"

stage1_model = None
stage2_model = None
yolo_model = None
PRODUCTION = False

# ── Local imports (adjust to your actual package layout) ──────────────────────
try:
    from app.backend.inference.inference import run_inference
    from app.backend.database.db import (
        save_event, get_events, get_stats, init_db
    )
    from app.backend.utils.deduplication import is_duplicate
    from app.backend.api.websocket_manager import manager
    PRODUCTION = True
except ImportError:
    # Fallback for local dev / testing without full package installed
    PRODUCTION = False
    manager = None  # replaced below

if PRODUCTION:
    try:
        from tensorflow.keras.models import load_model
        from ultralytics import YOLO
        stage1_model = load_model(STAGE1_MODEL_PATH)
        stage2_model = load_model(STAGE2_MODEL_PATH)
        yolo_model = YOLO(YOLO_MODEL_PATH)
        logger.info("Loaded sensor and vision models")
    except Exception as e:
        logger.warning(f"Model load failed: {e}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("roadguard")

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="RoadGuard-AI API",
    description="Hybrid edge-cloud road hazard detection",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include admin routes
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])

# Include admin routes
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])

# ── In-process WebSocket manager (used when package import fails) ──────────────
class _FallbackManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, ws):
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws):
        if ws in self.active_connections:
            self.active_connections.remove(ws)

    async def broadcast(self, data):
        import json
        msg = json.dumps(data)
        dead = []
        for c in self.active_connections:
            try:
                await c.send_text(msg)
            except Exception:
                dead.append(c)
        for d in dead:
            self.disconnect(d)

    async def send_personal_message(self, data, websocket):
        import json
        await websocket.send_text(json.dumps(data))

if manager is None:
    manager = _FallbackManager()

# ── In-memory event store (fallback when DB unavailable) ─────────────────────
_events: List[dict] = []

# ── Schemas ───────────────────────────────────────────────────────────────────
class AccelSegment(BaseModel):
    x: List[float] = Field(..., min_items=10)
    y: List[float] = Field(..., min_items=10)
    z: List[float] = Field(..., min_items=10)

class SensorRequest(BaseModel):
    accel: AccelSegment
    latitude: float = 0.0
    longitude: float = 0.0
    timestamp: Optional[str] = None

class MultimodalRequest(BaseModel):
    accel: AccelSegment
    image_b64: str                      # base64-encoded JPEG/PNG
    latitude: float = 0.0
    longitude: float = 0.0
    timestamp: Optional[str] = None

class VideoFrameRequest(BaseModel):
    image_b64: str
    latitude: float = 0.0
    longitude: float = 0.0
    timestamp: Optional[str] = None

class BatchRequest(BaseModel):
    samples: List[SensorRequest]

class HazardEvent(BaseModel):
    id: int
    label: str                          # Normal | Speed Breaker | Pothole
    label_id: int                       # 0 | 1 | 2
    confidence: float
    p_sensor: Optional[float]
    p_vision: Optional[float]
    latitude: float
    longitude: float
    timestamp: str

# ── Helpers ───────────────────────────────────────────────────────────────────
LABEL_MAP = {0: "Normal", 1: "Speed Breaker", 2: "Pothole"}

def _accel_to_array(accel: AccelSegment) -> np.ndarray:
    """Convert AccelSegment → (T, 3) numpy array."""
    length = min(len(accel.x), len(accel.y), len(accel.z), 100)
    arr = np.stack([accel.x[:length], accel.y[:length], accel.z[:length]], axis=1)
    # pad to 100 if shorter
    if arr.shape[0] < 100:
        pad = np.zeros((100 - arr.shape[0], 3))
        arr = np.vstack([arr, pad])
    return arr.astype(np.float32)

def _cascaded_inference_local(arr: np.ndarray):
    """Fallback pure-numpy cascaded inference (local inference without external model loading)."""
    sma = np.convolve(np.linalg.norm(arr, axis=1),
                      np.ones(10) / 10, mode="same")
    peak = float(np.max(sma))
    mean = float(np.mean(sma))
    k = 2.5
    if peak <= k * mean:
        return "Normal", 0.92, peak / (k * mean), "sensor"
    ratio = peak / (mean + 1e-9)
    if ratio > 4.5:
        return "Pothole", min(0.55 + (ratio - 4.5) * 0.05, 0.95), ratio / 10, "sensor"
    return "Speed Breaker", min(0.60 + (ratio - k) * 0.08, 0.95), ratio / 10, "sensor"


def _decode_image(img_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Unable to decode image")
    return img


def _sensor_inference(arr: np.ndarray):
    if stage1_model is None or stage2_model is None:
        raise RuntimeError("Sensor models are unavailable")
    data = np.expand_dims(arr, axis=0)
    stage1_pred = stage1_model.predict(data)
    if stage1_pred.ndim == 2 and stage1_pred.shape[1] > 1:
        hazard_score = float(stage1_pred[0, 1])
    else:
        hazard_score = float(stage1_pred[0])
    if hazard_score <= 0.5:
        return "Normal", 1.0 - hazard_score, "sensor"
    stage2_pred = stage2_model.predict(data)
    if stage2_pred.ndim > 1:
        probs = stage2_pred[0]
    else:
        probs = stage2_pred
    label_index = int(np.argmax(probs))
    subtype_labels = ["Pothole", "Bump", "Rough Road"]
    label = subtype_labels[label_index] if label_index < len(subtype_labels) else "Unknown"
    confidence = float(np.max(probs))
    return label, confidence, "sensor"


def _vision_inference(img_bytes: bytes):
    if yolo_model is None:
        raise RuntimeError("YOLO model is unavailable")
    img = _decode_image(img_bytes)
    results = yolo_model(img)
    if not results or len(results) == 0:
        return "Normal", 0.0, "vision"
    result = results[0]
    if not hasattr(result, "boxes") or len(result.boxes) == 0:
        return "Normal", 0.0, "vision"
    cls = int(result.boxes.cls[0])
    conf = float(result.boxes.conf[0])
    label = result.names.get(cls, "Unknown")
    return label, conf, "vision"


def _fuse_predictions(sensor_pred, vision_pred):
    sensor_label, sensor_conf, _ = sensor_pred
    vision_label, vision_conf, _ = vision_pred
    if sensor_label != "Normal" and vision_label != "Normal":
        label = sensor_label if sensor_conf >= vision_conf else vision_label
        confidence = max(sensor_conf, vision_conf)
        return label, confidence, "fusion"
    if sensor_label != "Normal":
        return sensor_label, min(sensor_conf * 0.8, 0.99), "sensor"
    if vision_label != "Normal":
        return vision_label, min(vision_conf * 0.8, 0.99), "vision"
    return "Normal", 0.95, "sensor"


def _store_event(label_id, label, confidence, p_sensor, p_vision, lat, lon, ts, source="sensor", status="active"):
    event = {
        "id": len(_events) + 1,
        "label": label,
        "label_id": label_id,
        "confidence": round(confidence, 4),
        "p_sensor": round(p_sensor, 4) if p_sensor is not None else None,
        "p_vision": round(p_vision, 4) if p_vision is not None else None,
        "latitude": lat,
        "longitude": lon,
        "timestamp": ts or datetime.utcnow().isoformat(),
        "source": source,
        "status": status,
    }
    _events.append(event)
    if len(_events) > 5000:       # rolling cap
        _events.pop(0)
    return event

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await init_db()
    if PRODUCTION:
        try: init_db()
        except Exception as e: logger.warning(f"DB init skipped: {e}")
    logger.info("RoadGuard-AI API ready")

@app.on_event("shutdown")
async def shutdown():
    await close_db()

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "mode": "production" if PRODUCTION else "fallback",
        "timestamp": datetime.utcnow().isoformat(),
        "events_stored": len(_events),
        "ws_clients": len(manager.active_connections),
    }

# ── Sensor-only inference ─────────────────────────────────────────────────────
@app.post("/api/predict")
async def predict_sensor(req: SensorRequest):
    arr = _accel_to_array(req.accel)

    if PRODUCTION:
        try:
            label, confidence, source = _sensor_inference(arr)
            p_sensor = confidence
            p_vision = None
        except Exception as e:
            logger.warning(f"Sensor inference failed: {e}")
            label, confidence, p_sensor, source = _cascaded_inference_local(arr)
            p_vision = None
    else:
        label, confidence, p_sensor, source = _cascaded_inference_local(arr)
        p_vision = None

    label_id = 0 if label == "Normal" else 1
    event = _store_event(label_id, label, confidence, p_sensor, p_vision,
                         req.latitude, req.longitude, req.timestamp, source)

    await manager.broadcast({"type": "new_event", "event": event})
    return event

# ── Sensor endpoint (alias for predict) ───────────────────────────────────────
@app.post("/api/sensor")
async def sensor_predict(req: SensorRequest):
    return await predict_sensor(req)

# ── Multimodal inference ──────────────────────────────────────────────────────
@app.post("/api/predict-multimodal")
async def predict_multimodal(req: MultimodalRequest):
    arr = _accel_to_array(req.accel)

    try:
        img_bytes = base64.b64decode(req.image_b64)
    except Exception:
        raise HTTPException(400, "Invalid base64 image data")

    if PRODUCTION:
        try:
            sensor_label, sensor_conf, _ = _sensor_inference(arr)
        except Exception as e:
            logger.warning(f"Sensor inference failed: {e}")
            sensor_label, sensor_conf, _ = _cascaded_inference_local(arr)
        try:
            vision_label, vision_conf, _ = _vision_inference(img_bytes)
        except Exception as e:
            logger.warning(f"Vision inference failed: {e}")
            vision_label, vision_conf, _ = "Normal", 0.0, "vision"
    else:
        sensor_label, sensor_conf, _ = _cascaded_inference_local(arr)
        vision_label, vision_conf, _ = "Normal", 0.0, "vision"

    label, confidence, source = _fuse_predictions(
        (sensor_label, sensor_conf, "sensor"),
        (vision_label, vision_conf, "vision")
    )
    p_sensor = sensor_conf if sensor_label != "Normal" else None
    p_vision = vision_conf if vision_label != "Normal" else None
    label_id = 0 if label == "Normal" else 1
    event = _store_event(label_id, label, confidence, p_sensor, p_vision,
                         req.latitude, req.longitude, req.timestamp, source)

    await manager.broadcast({"type": "new_event", "event": event})
    return event

# ── Video frame (vision only) ─────────────────────────────────────────────────
@app.post("/api/predict-video-frame")
async def predict_video_frame(req: VideoFrameRequest):
    """Vision-only inference from a single camera frame."""
    try:
        img_bytes = base64.b64decode(req.image_b64)
    except Exception:
        raise HTTPException(400, "Invalid base64 image data")

    image_b64 = None
    boxes = []
    if PRODUCTION:
        try:
            label, confidence, source = _vision_inference(img_bytes)
            results = yolo_model(_decode_image(img_bytes))
            if results and hasattr(results[0], "plot"):
                annotated = results[0].plot()
                if results[0].boxes is not None and len(results[0].boxes) > 0:
                    for box in results[0].boxes:
                        if box.xyxy is None or len(box.xyxy) == 0:
                            continue
                        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                        bbox_label = results[0].names.get(int(box.cls), "Unknown")
                        bbox_conf = float(box.conf[0])
                        text = f"{bbox_label} {bbox_conf:.2f}"
                        cv2.putText(
                            annotated,
                            text,
                            (x1, max(y1 - 10, 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.45,
                            (255, 255, 255),
                            1,
                            cv2.LINE_AA,
                        )
                        cv2.putText(
                            annotated,
                            text,
                            (x1, max(y1 - 10, 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.45,
                            (0, 0, 0),
                            2,
                            cv2.LINE_AA,
                        )
                _, buffer = cv2.imencode('.jpg', annotated)
                image_b64 = base64.b64encode(buffer.tobytes()).decode()
            if results and len(results[0].boxes) > 0:
                for idx, box in enumerate(results[0].boxes):
                    boxes.append({
                        "label": results[0].names.get(int(box.cls), "Unknown"),
                        "confidence": float(box.conf[0]),
                        "xyxy": box.xyxy[0].tolist(),
                    })
        except Exception as e:
            logger.warning(f"Vision inference failed: {e}")
            label, confidence, source = "Normal", 0.0, "vision"
    else:
        label, confidence, source = "Normal", 0.0, "vision"

    label_id = 0 if label == "Normal" else 1
    event = _store_event(label_id, label, confidence, None, confidence,
                         req.latitude, req.longitude, req.timestamp, source)

    await manager.broadcast({"type": "new_event", "event": event})
    response = {**event, "detection_boxes": boxes}
    if image_b64:
        response["image_b64"] = image_b64
    return response

# ── Upload hazard image ─────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_hazard(image: UploadFile, lat: float = Form(...), lng: float = Form(...)):
    try:
        img_bytes = await image.read()
    except Exception:
        raise HTTPException(400, "Invalid image file")

    if PRODUCTION:
        try:
            label, confidence, source = _vision_inference(img_bytes)
        except Exception as e:
            logger.warning(f"Vision inference failed: {e}")
            label, confidence, source = "Normal", 0.0, "vision"
    else:
        label, confidence, source = "Normal", 0.0, "vision"

    label_id = 0 if label == "Normal" else 1
    event = _store_event(label_id, label, confidence, None, confidence, lat, lng, None, source)

    await manager.broadcast({"type": "new_event", "event": event})
    return {"status": "success", "hazard": label, "confidence": confidence}

# ── Action on hazard ───────────────────────────────────────────────────────
@app.post("/api/action")
async def action_hazard(req: dict):
    hazard_id = req.get("id")
    status = req.get("status")
    if not hazard_id or status not in ["resolved", "ignored"]:
        raise HTTPException(400, "Invalid request")
    for e in _events:
        if e["id"] == hazard_id:
            e["status"] = status
            break
    return {"status": "updated"}

# ── Batch inference ───────────────────────────────────────────────────────────
@app.post("/api/predict-batch")
async def predict_batch(req: BatchRequest):
    results = []
    for sample in req.samples:
        arr = _accel_to_array(sample.accel)
        label_id, confidence, p_sensor = _cascaded_inference_local(arr)
        label = LABEL_MAP[label_id]
        event = _store_event(label_id, label, confidence, p_sensor, None,
                             sample.latitude, sample.longitude, sample.timestamp)
        results.append(event)
    return {"count": len(results), "results": results}

# ── Events ────────────────────────────────────────────────────────────────────
@app.get("/api/events")
async def get_hazard_events(
    label: Optional[str] = Query(None, description="Filter: Normal|Speed Breaker|Pothole"),
    limit: int = Query(200, le=1000),
    offset: int = Query(0, ge=0),
    hours: Optional[int] = Query(None, description="Last N hours"),
):
    events = list(reversed(_events))   # newest first

    if label:
        events = [e for e in events if e["label"] == label]

    if hours:
        cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
        events = [e for e in events if e["timestamp"] >= cutoff]

    total = len(events)
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "events": events[offset: offset + limit],
    }

# ── Stats ─────────────────────────────────────────────────────────────────────
@app.get("/api/events/stats")
async def get_event_stats():
    counts = {"Normal": 0, "Speed Breaker": 0, "Pothole": 0}
    conf_sum = {"Normal": 0.0, "Speed Breaker": 0.0, "Pothole": 0.0}

    for e in _events:
        lbl = e["label"]
        counts[lbl] = counts.get(lbl, 0) + 1
        conf_sum[lbl] = conf_sum.get(lbl, 0.0) + e["confidence"]

    # Hourly breakdown (last 24h)
    hourly: dict = {}
    cutoff = datetime.utcnow().replace(tzinfo=None) - timedelta(hours=24)
    for e in _events:
        try:
            ts = datetime.fromisoformat(e["timestamp"]).replace(tzinfo=None)
        except Exception:
            continue
        if ts < cutoff:
            continue
        hour_key = ts.strftime("%H:00")
        if hour_key not in hourly:
            hourly[hour_key] = {"Normal": 0, "Speed Breaker": 0, "Pothole": 0}
        hourly[hour_key][e["label"]] = hourly[hour_key].get(e["label"], 0) + 1

    avg_conf = {
        k: round(conf_sum[k] / counts[k], 4) if counts[k] > 0 else 0.0
        for k in counts
    }
    total = sum(counts.values())

    return {
        "total_events": total,
        "counts": counts,
        "avg_confidence": avg_conf,
        "hourly_24h": hourly,
        "last_updated": datetime.utcnow().isoformat(),
    }

# ── Demo seed endpoint removed ───────────────────────────────────────────────
# Demo data functionality has been removed. System now only processes real inputs:
# - Camera capture with video frames
# - Image file uploads with geolocation
# - Sensor data from accelerometer

# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info(f"WS client connected. Total: {len(manager.active_connections)}")
    try:
        # Send current snapshot on connect
        snapshot = {
            "type": "snapshot",
            "events": list(reversed(_events))[:50],
            "stats": {
                "total": len(_events),
                "normal": sum(1 for e in _events if e["label"] == "Normal"),
                "speed_breaker": sum(1 for e in _events if e["label"] == "Speed Breaker"),
                "pothole": sum(1 for e in _events if e["label"] == "Pothole"),
            }
        }
        await manager.send_personal_message(snapshot, websocket)

        while True:
            # Keep connection alive; client can also send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"WS client disconnected. Remaining: {len(manager.active_connections)}")

# ── Server startup ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002, log_level="info")
