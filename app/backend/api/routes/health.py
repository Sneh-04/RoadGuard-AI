"""Health check routes - model and API status endpoints."""
import logging

from fastapi import APIRouter

from ...utils.config import API_TITLE, API_VERSION, API_DESCRIPTION, DEVICE
from ...utils.schemas import HealthStatus
from ..dependencies import get_models_status
from ...vision.vision_inference import get_vision_pipeline
from ...models.model_loader import get_model_loader

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Health"])


@router.get(
    "/health",
    response_model=HealthStatus,
    summary="API health check",
    description="Returns health status and model loading status",
)
def health_check():
    """Check API and model health.
    
    Returns detailed status of all models and inference readiness.
    
    Returns:
        HealthStatus with API and model health information
    """
    loader = get_model_loader()
    status = loader.get_status()
    
    # Check vision pipeline
    try:
        vision_pipeline = get_vision_pipeline()
        vision_ready = vision_pipeline.is_ready() if hasattr(vision_pipeline, 'is_ready') else vision_pipeline.available
        vision_status = "loaded" if vision_ready else "not_loaded"
    except Exception as e:
        vision_ready = False
        vision_status = f"error: {str(e)}"
    
    # Determine overall status
    sensor_loaded = status["stage1_loaded"] and status["stage2_loaded"]
    if sensor_loaded and vision_ready:
        overall_status = "ok"
    elif sensor_loaded or vision_ready:
        overall_status = "degraded"
    else:
        overall_status = "error"
    
    return HealthStatus(
        status=overall_status,
        models_loaded=sensor_loaded and vision_ready,
        stage1_model=status["load_details"]["stage1"],
        stage2_model=status["load_details"]["stage2"],
        vision_model=vision_status,
        device=status["device"],
    )


@router.get(
    "/info",
    summary="API information",
    description="Returns API metadata and configuration",
)
def api_info():
    """Get API information.
    
    Returns:
        Dictionary with API metadata
    """
    return {
        "title": API_TITLE,
        "version": API_VERSION,
        "description": API_DESCRIPTION,
        "device": DEVICE,
        "endpoints": {
            "health": "/api/health (GET)",
            "predict": "/api/predict (POST)",
            "docs": "/docs (interactive API documentation)",
            "redoc": "/redoc (alternative documentation)",
        }
    }


@router.get("/", tags=["Root"])
def root():
    """Root endpoint - returns API information."""
    return {
        "message": "RoadHazardProject API",
        "docs": "Visit /docs for interactive API documentation",
        "version": API_VERSION,
    }
