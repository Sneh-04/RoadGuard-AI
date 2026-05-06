"""Shared dependencies and utilities for API routes."""
import logging
from typing import Optional

from fastapi import Depends, HTTPException

from ..models.model_loader import get_model_loader
from ..inference.inference import HazardInferencePipeline
from ..vision.vision_inference import get_vision_pipeline

logger = logging.getLogger(__name__)


def get_models_status() -> dict:
    """Get status of all loaded models.
    
    Returns:
        Dictionary with model status information
    """
    loader = get_model_loader()
    return loader.get_status()


def check_sensor_models_ready() -> bool:
    """Check if sensor models are loaded and ready.
    
    Returns:
        True if models are ready
        
    Raises:
        HTTPException: If models not loaded
    """
    loader = get_model_loader()
    if not loader.is_ready():
        logger.error("Sensor models not loaded")
        raise HTTPException(
            status_code=503,
            detail="Sensor models not loaded. Service unavailable."
        )
    return True


def check_vision_models_ready() -> bool:
    """Check if vision models are loaded and ready.
    
    Returns:
        True if models are ready
        
    Raises:
        HTTPException: If models not loaded
    """
    try:
        vision_pipeline = get_vision_pipeline()
        if not vision_pipeline.is_ready():
            logger.error("Vision model not loaded")
            raise HTTPException(
                status_code=503,
                detail="Vision model not loaded. Service unavailable."
            )
        return True
    except Exception as e:
        logger.error(f"Vision pipeline error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Vision pipeline unavailable."
        )


def get_inference_pipeline(app_state=Depends(lambda: None)) -> HazardInferencePipeline:
    """Get the global inference pipeline instance.
    
    Returns:
        HazardInferencePipeline instance
        
    Raises:
        HTTPException: If pipeline not initialized
    """
    # Note: In actual usage, pass app.state as dependency
    # This is a placeholder for manual injection
    if app_state is None:
        raise HTTPException(
            status_code=503,
            detail="Inference pipeline not initialized"
        )
    
    pipeline = getattr(app_state, "inference_pipeline", None)
    if pipeline is None:
        logger.error("Inference pipeline not initialized")
        raise HTTPException(
            status_code=503,
            detail="Models not ready for inference"
        )
    return pipeline
