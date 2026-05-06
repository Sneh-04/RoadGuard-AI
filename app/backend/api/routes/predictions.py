"""Prediction routes - sensor, vision, multimodal, and batch inference endpoints."""
import asyncio
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from ...database.db import get_db, save_event
from ...database.models import User
from ...inference.inference import InferenceError, HazardInferencePipeline
from ...utils.schemas import (
    PredictionRequest,
    PredictionResponse,
    MultimodalPredictionRequest,
    MultimodalPredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
)
from ...utils.deduplication import is_duplicate
from ..security import get_current_user
from ..dependencies import (
    check_sensor_models_ready,
    check_vision_models_ready,
)
from ...models.model_loader import get_model_loader
from ...vision.vision_inference import get_vision_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Inference"])

# Global app state reference - will be set by main.py
_app_state = None


def set_app_state(app_state):
    """Set the FastAPI app state for accessing inference pipeline."""
    global _app_state
    _app_state = app_state


def get_pipeline() -> HazardInferencePipeline:
    """Get the inference pipeline from app state.
    
    Returns:
        HazardInferencePipeline instance
        
    Raises:
        HTTPException: If pipeline not initialized
    """
    if _app_state is None:
        raise HTTPException(
            status_code=503,
            detail="Inference pipeline not initialized"
        )
    
    pipeline = getattr(_app_state, "inference_pipeline", None)
    if pipeline is None:
        logger.error("Inference pipeline not available in app state")
        raise HTTPException(
            status_code=503,
            detail="Models not ready for inference"
        )
    return pipeline


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Run hazard detection inference",
    description=(
        "Run two-stage cascaded inference on accelerometer data. "
        "Stage 1: classify as Normal vs Hazard. "
        "Stage 2: if hazard, classify as Speedbreaker vs Pothole."
    ),
)
def predict(
    request: PredictionRequest,
    current_user: User = Depends(get_current_user),
) -> PredictionResponse:
    """Run inference on accelerometer data.
    
    Args:
        request: PredictionRequest with accelerometer data (100 timesteps × 3 axes)
        current_user: Authenticated user
        
    Returns:
        PredictionResponse with hazard classification and confidence scores
        
    Raises:
        HTTPException: If input invalid, models not loaded, or inference fails
    """
    try:
        # Validate input shape
        request.validate_shape()
    except ValueError as e:
        logger.warning(f"Invalid input: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input data: {str(e)}"
        )
    
    # Check models are loaded
    check_sensor_models_ready()
    
    # Get inference pipeline
    pipeline = get_pipeline()
    
    try:
        response = pipeline.predict(request.data)
        logger.info(f"Prediction successful: {response}")
        return response
    except InferenceError as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {str(e)}"
        )


@router.post(
    "/predict-multimodal",
    response_model=MultimodalPredictionResponse,
    summary="Run multimodal sensor-vision fusion inference",
    description=(
        "Run fused inference combining accelerometer sensor data and vision data. "
        "Returns combined hazard detection with confidence scores from both modalities."
    ),
)
async def predict_multimodal(
    request: MultimodalPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MultimodalPredictionResponse:
    """Run multimodal sensor-vision fusion inference.
    
    Args:
        request: MultimodalPredictionRequest with sensor and image data
        current_user: Authenticated user
        db: Database session
        
    Returns:
        MultimodalPredictionResponse with fused prediction results
        
    Raises:
        HTTPException: If input invalid, models not loaded, or inference fails
    """
    try:
        # Validate sensor input shape
        request.validate_sensor_shape()
    except ValueError as e:
        logger.warning(f"Invalid sensor input: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sensor data: {str(e)}"
        )
    
    # Check both models are loaded
    check_sensor_models_ready()
    check_vision_models_ready()
    
    # Get inference pipeline
    pipeline = get_pipeline()
    
    try:
        # Run sensor and vision inference in parallel
        async def run_sensor():
            return await asyncio.get_event_loop().run_in_executor(
                None, pipeline._predict_sensor_internal, request.sensor_data
            )
        
        async def run_vision():
            return await asyncio.get_event_loop().run_in_executor(
                None, pipeline.vision_pipeline.predict_image, request.image_data
            )
        
        sensor_result, vision_result = await asyncio.gather(run_sensor(), run_vision())
        
        # Convert sensor result to dict
        result_dict = {
            "hazard_detected": sensor_result.hazard_detected,
            "hazard_type": sensor_result.hazard_type.value if sensor_result.hazard_type else None,
            "confidence": sensor_result.confidence,
            "severity_score": sensor_result.severity_score
        }
        
        # Fuse predictions
        fused = pipeline.fusion_pipeline.fuse_predictions(result_dict, vision_result)
        
        result = {
            "hazard_detected": fused.hazard_type != 0,
            "hazard_type": fused.hazard_type.value,
            "final_confidence": fused.confidence,
            "sensor_confidence": fused.sensor_confidence,
            "vision_confidence": fused.vision_confidence,
            "severity_score": fused.confidence,
        }
        
        # Save to database
        try:
            event_data = {
                "timestamp": datetime.utcnow(),
                "latitude": request.latitude,
                "longitude": request.longitude,
                "label": result["hazard_type"],
                "label_name": "normal" if result["hazard_type"] == 0 else (
                    "speedbreaker" if result["hazard_type"] == 1 else "pothole"
                ),
                "p_sensor": result["sensor_confidence"],
                "p_vision": result["vision_confidence"],
                "p_final": result["final_confidence"],
                "confidence": result["final_confidence"],
                "is_duplicate": is_duplicate(db, request.latitude, request.longitude)
            }
            save_event(db, event_data)
            logger.info(f"Event saved to database (duplicate: {event_data['is_duplicate']})")
        except Exception as db_e:
            logger.error(f"Failed to save event to database: {db_e}")
        
        return MultimodalPredictionResponse(**result)
    except InferenceError as e:
        logger.error(f"Multimodal inference error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Multimodal inference failed: {str(e)}"
        )


@router.post(
    "/predict-batch",
    response_model=BatchPredictionResponse,
    summary="Run batch inference on multiple samples",
    description=(
        "Process multiple samples in a single request. "
        "Supports both sensor-only and multimodal batch processing."
    ),
)
def predict_batch(
    request: BatchPredictionRequest,
    current_user: User = Depends(get_current_user),
) -> BatchPredictionResponse:
    """Run batch inference on multiple samples.
    
    Args:
        request: BatchPredictionRequest with sensor_batch and optional image_batch
        current_user: Authenticated user
        
    Returns:
        BatchPredictionResponse with predictions for each sample
        
    Raises:
        HTTPException: If input invalid, models not loaded, or inference fails
    """
    # Validate batch size
    if len(request.sensor_batch) == 0:
        raise HTTPException(
            status_code=400,
            detail="Sensor batch cannot be empty"
        )
    
    if request.image_batch and len(request.image_batch) != len(request.sensor_batch):
        raise HTTPException(
            status_code=400,
            detail="Image batch length must match sensor batch length"
        )
    
    # Validate each sensor sample
    for i, sensor_data in enumerate(request.sensor_batch):
        try:
            if len(sensor_data) != 100:
                raise ValueError(f"Sample {i}: Expected 100 timesteps, got {len(sensor_data)}")
            for j, timestep in enumerate(sensor_data):
                if len(timestep) != 3:
                    raise ValueError(f"Sample {i}, timestep {j}: Expected 3 axes, got {len(timestep)}")
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sensor data in batch: {str(e)}"
            )
    
    # Check models are loaded for sensor inference
    check_sensor_models_ready()
    
    # Check vision if images provided
    if request.image_batch:
        check_vision_models_ready()
    
    # Get inference pipeline
    pipeline = get_pipeline()
    
    try:
        predictions = pipeline.predict_batch(request.sensor_batch, request.image_batch)
        logger.info(f"Batch prediction successful: {len(predictions)} samples")
        return BatchPredictionResponse(predictions=predictions)
    except InferenceError as e:
        logger.error(f"Batch inference error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch inference failed: {str(e)}"
        )


@router.post(
    "/predict-video-frame",
    summary="Upload and analyze video frame",
    description="Upload an image file to detect hazards",
)
async def predict_video_frame(file: UploadFile = File(...)):
    """Accept image file and create a demo hazard event.
    
    Args:
        file: Image file to analyze
        
    Returns:
        Success message with event data
        
    Raises:
        HTTPException: If file processing fails
    """
    try:
        # Read file bytes (but don't need to process for demo)
        await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    
    # Create random hazard event for demo
    import random
    
    new_event = {
        "id": random.randint(100, 10000),
        "label": random.choice(["POTHOLE", "SPEEDBREAKER"]),
        "latitude": 12.9716 + random.random() / 100,
        "longitude": 77.5946 + random.random() / 100,
        "status": "ACTIVE"
    }
    
    logger.info(f"Demo event created: {new_event}")
    
    return {"message": "uploaded", "event": new_event}
