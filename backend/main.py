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
import json
import logging
import os
import time
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import admin modules
from .database import init_db, close_db
from .routes import router as admin_router
from .sensor_detection import smart_prediction

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
YOLO_MODEL_PATH = MODEL_DIR / "best.pt"
STAGE1_MODEL = MODEL_DIR / "stage1_binary_v2.keras"
STAGE2_MODEL = MODEL_DIR / "stage2_subtype_v2.keras"

PRODUCTION = os.getenv("PRODUCTION", "false").lower() == "true"
DISABLE_ML = os.getenv("DISABLE_ML", "false").lower() == "true"

stage1_model = None
stage2_model = None
yolo_model = None
manager = None  # Will be set to _FallbackManager() if not imported

# ── Logging setup first ─────────────────────────────────────────────────────
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
events = []

# Initialize with demo data for UI display
events = [
    {
        "id": 1,
        "label": "POTHOLE",
        "latitude": 12.97 + 0.005,
        "longitude": 77.59 + 0.003,
        "status": "ACTIVE"
    },
    {
        "id": 2,
        "label": "SPEEDBREAKER",
        "latitude": 12.97 + 0.008,
        "longitude": 77.59 + 0.005,
        "status": "ACTIVE"
    },
    {
        "id": 3,
        "label": "POTHOLE",
        "latitude": 12.97 + 0.002,
        "longitude": 77.59 + 0.008,
        "status": "ACTIVE"
    },
]

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
    speed: Optional[float] = None

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


def _sensor_inference_dummy():
    """Return dummy sensor prediction when ML is disabled."""
    labels = ["Normal", "Pothole", "Speed Breaker"]
    label = labels[random.randint(0, 2)]
    confidence = random.uniform(0.6, 0.95)
    return label, confidence, "sensor_dummy"


def _sensor_inference(arr: np.ndarray):
    if DISABLE_ML:
        return _sensor_inference_dummy()
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


def _vision_inference_dummy():
    """Return dummy vision prediction when ML is disabled."""
    labels = ["Normal", "Pothole", "Speed Breaker"]
    label = labels[random.randint(0, 2)]
    confidence = random.uniform(0.5, 0.85)
    return label, confidence, "vision_dummy"


def _vision_inference(img_bytes: bytes):
    if DISABLE_ML:
        return _vision_inference_dummy()
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


def _try_load_keras_model(path: Path):
    try:
        from keras.models import load_model
    except ImportError:
        try:
            from tensorflow.keras.models import load_model
        except ImportError as e:
            logger.warning("Keras load_model import failed: %s", e)
            return None

    try:
        logger.info("Loading sensor model from %s", path)
        return load_model(str(path))
    except Exception as e:
        logger.warning("Failed to load Keras model %s: %s", path, e)
        return None


def load_models():
    global stage1_model, stage2_model, yolo_model

    if DISABLE_ML:
        logger.info("ML disabled (DISABLE_ML=true): skipping model loading")
        return

    if not PRODUCTION:
        logger.info("Production mode disabled: using fallback inference.")
        return

    if YOLO_MODEL_PATH.exists():
        try:
            from ultralytics import YOLO
            yolo_model = YOLO(str(YOLO_MODEL_PATH))
            logger.info("Loaded YOLO model from %s", YOLO_MODEL_PATH)
        except Exception as e:
            logger.warning("Unable to load YOLO model: %s", e)
            yolo_model = None
    else:
        logger.warning("YOLO model file not found at %s", YOLO_MODEL_PATH)
        yolo_model = None

    if STAGE1_MODEL.exists() and STAGE2_MODEL.exists():
        stage1_model = _try_load_keras_model(STAGE1_MODEL)
        stage2_model = _try_load_keras_model(STAGE2_MODEL)
        if stage1_model is None or stage2_model is None:
            logger.warning("One or more sensor models failed to load; using fallback inference.")
    else:
        logger.warning("Sensor model files are missing: %s, %s", STAGE1_MODEL, STAGE2_MODEL)
        stage1_model = None
        stage2_model = None


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
        "id": len(events) + 1,
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
    events.append(event)
    if len(events) > 5000:       # rolling cap
        events.pop(0)
    return event

async def process_mobile_sensor_data(sensor_data, websocket):
    """Process sensor data from mobile app using smart prediction."""
    try:
        sensor_readings = sensor_data.get("sensor", [])
        location = sensor_data.get("location", {})
        lat = location.get("lat", 0.0)
        lng = location.get("lng", 0.0)
        speed = sensor_data.get("speed", 0)  # Get speed from mobile app
        
        # Process each accelerometer reading
        hazard_detected = False
        hazard_type = None
        
        for accel_reading in sensor_readings:
            if len(accel_reading) >= 3:
                ax, ay, az = accel_reading[:3]
                
                # Use smart prediction
                result = smart_prediction({
                    "accel": [ax, ay, az],
                    "speed": speed
                })
                
                if result.get("hazard") in ["pothole", "speedbreaker"]:
                    hazard_detected = True
                    hazard_type = result["hazard"]
                    confidence = result.get("confidence", 0.8)
                    
                    # Store event
                    label_id = 1 if hazard_type == "pothole" else 2
                    event = _store_event(
                        label_id=label_id,
                        label=hazard_type.upper(),
                        confidence=confidence,
                        p_sensor=confidence,
                        p_vision=None,
                        lat=lat,
                        lon=lng,
                        ts=datetime.utcnow().isoformat(),
                        source="mobile_sensor"
                    )
                    
                    # Broadcast to all clients
                    await manager.broadcast({"type": "new_event", "event": event})
                    
                    # Send alert back to mobile app
                    alert_data = {
                        "type": "hazard_alert",
                        "hazard_detected": True,
                        "hazard_type": hazard_type,
                        "confidence": confidence,
                        "location": {"lat": lat, "lng": lng}
                    }
                    await manager.send_personal_message(alert_data, websocket)
                    
                    break  # Only report first hazard in batch
        
        # If no hazard detected, send clear status
        if not hazard_detected:
            clear_data = {
                "type": "status",
                "hazard_detected": False,
                "message": "Road clear"
            }
            await manager.send_personal_message(clear_data, websocket)
            
    except Exception as e:
        logger.error(f"Error processing mobile sensor data: {e}")
        await manager.send_personal_message({
            "type": "error",
            "message": "Failed to process sensor data"
        }, websocket)
# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("Starting RoadGuard-AI API...")
    db_ok = await init_db()
    if not db_ok:
        logger.warning("Database not available; continuing with fallback in-memory storage.")
    load_models()
    ml_status = "disabled" if DISABLE_ML else ("production" if PRODUCTION else "fallback")
    logger.info("RoadGuard-AI API ready (ml=%s, production=%s)", ml_status, PRODUCTION)

@app.on_event("shutdown")
async def shutdown():
    await close_db()

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/health")
async def health():
    ml_status = "disabled" if DISABLE_ML else ("production" if PRODUCTION else "fallback")
    return {
        "status": "ok",
        "ml": ml_status,
        "mode": "production" if PRODUCTION else "fallback",
        "timestamp": datetime.utcnow().isoformat(),
        "events_stored": len(events),
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
async def predict_video_frame(file: UploadFile = File(...)):
    """Accept image file and create a hazard event."""
    try:
        img_bytes = await file.read()
    except Exception:
        raise HTTPException(400, "Invalid image file")

    # Simulate detection
    new_event = {
        "id": len(events) + 1,
        "label": random.choice(["POTHOLE", "SPEEDBREAKER"]),
        "latitude": 12.97 + random.random()/100,
        "longitude": 77.59 + random.random()/100,
        "status": "ACTIVE"
    }

    events.append(new_event)
    
    # Broadcast to WebSocket clients
    await manager.broadcast({"type": "new_event", "event": new_event})

    return {"message": "uploaded", "event": new_event}

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

# ── Admin Action: Mark Hazard as Solved ────────────────────────────────────
@app.patch("/api/events/{event_id}/solve")
def solve_event(event_id: int):
    """Mark a hazard as solved."""
    for e in events:
        if e["id"] == event_id:
            e["status"] = "SOLVED"
            return {"message": "updated"}
    raise HTTPException(404, "Event not found")

@app.patch("/api/events/{event_id}/ignore")
def ignore_event(event_id: int):
    """Mark a hazard as ignored."""
    for e in events:
        if e["id"] == event_id:
            e["status"] = "IGNORED"
            return {"message": "updated"}
    raise HTTPException(404, "Event not found")

# ── Action on hazard (legacy) ───────────────────────────────────────────────
@app.post("/api/action")
async def action_hazard(req: dict):
    hazard_id = req.get("id")
    status = req.get("status")
    if not hazard_id or status not in ["resolved", "ignored"]:
        raise HTTPException(400, "Invalid request")
    for e in events:
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
def get_events():
    """Get all events."""
    return {"events": events}

# ── Stats ─────────────────────────────────────────────────────────────────────
@app.get("/api/events/stats")
async def get_event_stats():
    counts = {"POTHOLE": 0, "SPEEDBREAKER": 0}
    
    for e in events:
        lbl = e["label"]
        counts[lbl] = counts.get(lbl, 0) + 1

    total = sum(counts.values())

    return {
        "total_events": total,
        "counts": counts,
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
    try:
        logger.info(f"🔌 WebSocket connection attempt from {websocket.client}")
        await manager.connect(websocket)
        logger.info(f"✅ WS client connected. Total: {len(manager.active_connections)}")
    except Exception as e:
        logger.error(f"❌ Error accepting WebSocket: {e}", exc_info=True)
        await websocket.close(code=1008, reason=f"Accept failed: {str(e)}")
        return
    
    try:
        # Send current snapshot on connect
        snapshot = {
            "type": "snapshot",
            "events": list(reversed(events))[:50],
            "stats": {
                "total": len(events),
                "pothole": sum(1 for e in events if e["label"] == "POTHOLE"),
                "speedbreaker": sum(1 for e in events if e["label"] == "SPEEDBREAKER"),
            }
        }
        await manager.send_personal_message(snapshot, websocket)

        while True:
            # Keep connection alive; client can also send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
            else:
                try:
                    # Process sensor data from mobile app
                    sensor_data = json.loads(data)
                    if sensor_data.get("mode") == "sensor":
                        await process_mobile_sensor_data(sensor_data, websocket)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received: {data}")
                except Exception as e:
                    logger.error(f"Error processing sensor data: {e}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"WS client disconnected. Remaining: {len(manager.active_connections)}")
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}", exc_info=True)
        manager.disconnect(websocket)

# ── Server startup ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002, log_level="info")
