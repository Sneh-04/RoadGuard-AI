"""Real-time WebSocket routes for live prediction streaming."""
import logging
import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Real-time"])


@router.websocket("/ws/live")
async def live_predictions(ws: WebSocket):
    """WebSocket endpoint for real-time hazard predictions.
    
    Supports three modes:
    1. Sensor-only: { "sensor": [[...100 timesteps...]], "mode": "sensor" }
    2. Vision-only: { "image": <bytes>, "mode": "vision" }
    3. Multimodal fusion: { "sensor": [[...]], "image": <bytes>, "mode": "fusion" }
    
    Returns prediction result in real-time.
    
    Example client (JavaScript):
    ```javascript
    const ws = new WebSocket("ws://localhost:8000/ws/live");
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        sensor: [[0.1, 0.2, 0.3], ...],  // 100 timesteps × 3 axes
        mode: "sensor"
      }));
    };
    
    ws.onmessage = (e) => {
      const result = JSON.parse(e.data);
      console.log("Prediction:", result);
    };
    ```
    """
    await ws.accept()
    logger.info("WebSocket client connected: /ws/live")
    
    try:
        while True:
            # Receive message from client
            data = await ws.receive_json()
            logger.debug(f"Received WebSocket message: {data.get('mode', 'unknown')} mode")
            
            # Get inference pipeline from app state
            pipeline = ws.app.state.inference_pipeline
            if pipeline is None:
                await ws.send_json({
                    "error": "Inference pipeline not available",
                    "status": "failed"
                })
                continue
            
            try:
                # Route to appropriate prediction method based on mode
                mode = data.get("mode", "sensor").lower()
                result = None
                
                if mode == "vision" and "image" in data:
                    # Vision-only prediction
                    logger.debug("Running vision-only prediction")
                    hazard_type, confidence = pipeline.predict_vision(data["image"])
                    result = {
                        "mode": "vision",
                        "hazard_type": hazard_type,
                        "confidence": float(confidence),
                        "status": "success"
                    }
                
                elif mode == "fusion" and "sensor" in data and "image" in data:
                    # Multimodal fusion prediction
                    logger.debug("Running multimodal fusion prediction")
                    fused_result = pipeline.predict_multimodal(
                        data["sensor"],
                        data["image"]
                    )
                    result = {
                        "mode": "fusion",
                        "hazard_detected": fused_result.get("hazard_detected", False),
                        "hazard_type": fused_result.get("hazard_type", 0),
                        "final_confidence": fused_result.get("final_confidence", 0.0),
                        "sensor_confidence": fused_result.get("sensor_confidence", 0.0),
                        "vision_confidence": fused_result.get("vision_confidence", 0.0),
                        "severity_score": fused_result.get("severity_score", 0.0),
                        "status": "success"
                    }
                
                elif mode == "batch" and "sensor_batch" in data:
                    # Batch prediction
                    logger.debug("Running batch prediction")
                    image_batch = data.get("image_batch", None)
                    batch_results = pipeline.predict_batch(
                        data["sensor_batch"],
                        image_batch
                    )
                    result = {
                        "mode": "batch",
                        "predictions": batch_results,
                        "count": len(batch_results),
                        "status": "success"
                    }
                
                else:
                    # Default: sensor-only prediction
                    if "sensor" not in data:
                        await ws.send_json({
                            "error": "Missing required data: 'sensor' for mode=sensor",
                            "status": "failed"
                        })
                        continue
                    
                    logger.debug("Running sensor-only prediction")
                    sensor_result = pipeline.predict(data["sensor"])
                    result = {
                        "mode": "sensor",
                        "hazard_detected": sensor_result.hazard_detected,
                        "hazard_type": sensor_result.hazard_type.value if sensor_result.hazard_type else 0,
                        "confidence": float(sensor_result.confidence),
                        "severity_score": float(sensor_result.severity_score),
                        "status": "success"
                    }
                
                # Send result back to client
                if result:
                    await ws.send_json(result)
                    logger.debug(f"Sent prediction result: {result.get('status')}")
            
            except ValueError as e:
                logger.warning(f"Validation error: {str(e)}")
                await ws.send_json({
                    "error": f"Invalid input: {str(e)}",
                    "status": "failed"
                })
            except Exception as e:
                logger.error(f"Prediction error: {str(e)}", exc_info=True)
                await ws.send_json({
                    "error": f"Prediction failed: {str(e)}",
                    "status": "failed"
                })
    
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        try:
            await ws.send_json({
                "error": f"WebSocket error: {str(e)}",
                "status": "failed"
            })
        except:
            pass


@router.websocket("/ws/stream-events")
async def stream_events(ws: WebSocket):
    """WebSocket endpoint for streaming real-time hazard events.
    
    Clients can subscribe to receive events as they are detected.
    
    This is a placeholder for event streaming - can be extended to:
    - Broadcast detected hazards to all connected clients
    - Stream location updates
    - Push notifications for urgent hazards
    """
    await ws.accept()
    logger.info("WebSocket client connected: /ws/stream-events")
    
    try:
        # Keep connection open
        while True:
            # In a real implementation, this would:
            # 1. Listen for new events from a queue
            # 2. Filter by user preferences
            # 3. Send to client
            
            # For now, wait for client messages
            data = await ws.receive_json()
            
            if data.get("action") == "subscribe":
                region = data.get("region", "all")
                logger.info(f"Client subscribed to events for region: {region}")
                
                await ws.send_json({
                    "status": "subscribed",
                    "region": region,
                    "message": f"Listening for hazard events in {region}"
                })
            
            elif data.get("action") == "unsubscribe":
                logger.info("Client unsubscribed from events")
                break
    
    except WebSocketDisconnect:
        logger.info("Event stream client disconnected")
    except Exception as e:
        logger.error(f"Event stream error: {str(e)}", exc_info=True)
