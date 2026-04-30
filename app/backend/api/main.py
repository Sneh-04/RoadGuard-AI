"""Main FastAPI application - production-ready backend server.

Routes are organized in modular structure under api/routes/:
- auth.py: Authentication endpoints
- admin.py: Admin management endpoints
- health.py: Health check endpoints
- predictions.py: Inference endpoints
- events.py: Event management and reporting endpoints
"""
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException

from ..utils.config import (
    API_TITLE,
    API_VERSION,
    API_DESCRIPTION,
    DEVICE,
    LOG_LEVEL,
)
from ..models.model_loader import get_model_loader
from ..inference.inference import HazardInferencePipeline
from ..database.db import create_db

# Import route routers
from .routes import (
    auth_router,
    admin_router,
    health_router,
    predictions_router,
    events_router,
)
from .routes.predictions import set_app_state

# Configure logging
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)



# ============================================================================
# Global State
# ============================================================================

# Model loader and inference pipeline - initialized during startup
model_loader = get_model_loader()
inference_pipeline: Optional[HazardInferencePipeline] = None


# ============================================================================
# Startup and Shutdown Events (Lifespan)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown events.
    
    Startup:
    - Loads all ML models once at startup (singleton pattern)
    - Creates database tables
    - Initializes inference pipeline
    - Stores references in app.state for route handlers
    
    Shutdown:
    - Logs shutdown message
    - Releases resources
    """

    # =====================================================================
    # STARTUP
    # =====================================================================
    logger.info("=" * 60)
    logger.info("🚀 RoadHazardProject API Starting Up")
    logger.info("=" * 60)

    try:
        # Load all models at startup (not per-request)
        status = model_loader.load_all_models()

        if not model_loader.is_ready():
            logger.warning("⚠️  Not all models loaded successfully")
            logger.warning(f"Status: {status}")
        else:
            logger.info("✅ All models loaded successfully")
            logger.info(f"Inference device: {DEVICE}")

        # Create database tables
        try:
            create_db()
            logger.info("✅ Database tables created successfully")
        except Exception as db_e:
            logger.error(f"❌ Database creation failed: {db_e}")
            # Don't crash if DB fails, but log it

        # Store loader in app state for later access
        app.state.model_loader = model_loader

        # Initialize inference pipeline
        global inference_pipeline
        try:
            inference_pipeline = HazardInferencePipeline()
            app.state.inference_pipeline = inference_pipeline
            
            # Pass app state to predictions router for pipeline access
            set_app_state(app.state)
            
            logger.info("✅ Inference pipeline initialized successfully")
        except Exception as e:
            logger.warning(f"⚠️  Inference pipeline initialization failed: {e}")
            inference_pipeline = None
            app.state.inference_pipeline = None

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}", exc_info=True)
        # Do not crash entire server, mark as degraded
        inference_pipeline = None
        app.state.inference_pipeline = None

    logger.info("=" * 60)
    logger.info("✅ Application ready to receive requests")
    logger.info("=" * 60)

    yield  # Application runs here

    # =====================================================================
    # SHUTDOWN
    # =====================================================================
    logger.info("🛑 Application shutting down...")
    logger.info("Releasing resources...")


# ============================================================================
# Create FastAPI Application
# ============================================================================

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    lifespan=lifespan,
)


# ============================================================================
# CORS Middleware
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (customize for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Global Exception Handlers
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions with structured error response."""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
        }
    )


# ============================================================================
# Include Route Routers
# ============================================================================

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(health_router)
app.include_router(predictions_router)
app.include_router(events_router)


# ============================================================================
# Startup Test
# ============================================================================

if __name__ == "__main__":
    # For debugging: run with `python -m app.backend.main`
    import uvicorn
    
    logger.info("Starting server via __main__...")
    uvicorn.run(
        "app.backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=LOG_LEVEL.lower(),
    )

