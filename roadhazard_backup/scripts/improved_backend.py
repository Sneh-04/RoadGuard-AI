#!/usr/bin/env python3
"""
IMPROVED FASTAPI BACKEND: Road Hazard Detection
Research-grade production-ready API with proper error handling, logging, and validation.

Run with:
  uvicorn improved_backend:app --reload --host 0.0.0.0 --port 8000
"""

import os
import sys
import time
import logging
import numpy as np
import tensorflow as tf
from datetime import datetime
from typing import List
from pydantic import BaseModel, Field, validator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ====== LOGGING ======
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ====== APP INITIALIZATION ======
app = FastAPI(
    title="Road Hazard Detection API",
    description="2-stage cascaded CNN for road hazard detection from accelerometer data",
    version="2.0"
)

# ====== CORS MIDDLEWARE (RESTRICTED) ======
logger.info("Configuring CORS...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://127.0.0.1",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
logger.info("✅ CORS configured (restricted origins)")

# ====== CONFIGURATION ======
from config import MODEL_DIR

STAGE1_MODEL_PATH = os.path.join(MODEL_DIR, "stage1_binary_v2.keras")
STAGE2_MODEL_PATH = os.path.join(MODEL_DIR, "stage2_subtype_v2.keras")

EXPECTED_TIMESTEPS = 100
EXPECTED_FEATURES = 3
THRESHOLD_NORMAL_HAZARD = 0.5
THRESHOLD_SPEEDBREAKER_POTHOLE = 0.5

# ====== GLOBAL MODELS ======
logger.info("Loading models at startup...")
stage1_model = None
stage2_model = None

try:
    logger.info(f"Loading Stage-1 model from {STAGE1_MODEL_PATH}")
    stage1_model = tf.keras.models.load_model(STAGE1_MODEL_PATH, compile=False)
    logger.info("✅ Stage-1 model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load Stage-1 model: {e}")
    stage1_model = None

try:
    logger.info(f"Loading Stage-2 model from {STAGE2_MODEL_PATH}")
    stage2_model = tf.keras.models.load_model(STAGE2_MODEL_PATH, compile=False)
    logger.info("✅ Stage-2 model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load Stage-2 model: {e}")
    stage2_model = None

# ====== REQUEST/RESPONSE MODELS ======
class SensorReading(BaseModel):
    """Single accelerometer sensor reading with 3-axis data."""
    data: List[List[float]] = Field(
        ...,
        description="List of [x, y, z] acceleration readings. Shape must be (timesteps, 3)"
    )

    @validator('data')
    def validate_shape(cls, v):
        if not isinstance(v, list):
            raise ValueError("data must be a list")
        if len(v) == 0:
            raise ValueError("data cannot be empty")
        if any(not isinstance(x, (list, tuple)) or len(x) != 3 for x in v):
            raise ValueError("Each reading must have exactly 3 values [x, y, z]")
        return v


class HazardPrediction(BaseModel):
    """Prediction response for a sensor reading."""
    stage1_result: str = Field(..., description="Normal or Hazard")
    stage1_confidence: float = Field(..., description="Confidence score for Stage-1 (0-1)")
    stage2_result: str | None = Field(None, description="Speedbreaker or Pothole (if hazard detected)")
    stage2_confidence: float | None = Field(None, description="Confidence score for Stage-2 (0-1)")
    processing_time_ms: float = Field(..., description="API processing time in milliseconds")
    error: str | None = Field(None, description="Error message if any")


# ====== VALIDATION FUNCTIONS ======
def validate_input(data: List[List[float]]) -> tuple[bool, str, np.ndarray]:
    """
    Validate input data.
    
    Returns:
        (is_valid, error_message, numpy_array)
    """
    try:
        # Convert to numpy array
        arr = np.array(data, dtype=np.float32)
        
        # Check shape
        if arr.ndim != 2:
            return False, f"Input must be 2D array, got {arr.ndim}D", arr
        
        if arr.shape[0] != EXPECTED_TIMESTEPS:
            return False, f"Expected {EXPECTED_TIMESTEPS} timesteps, got {arr.shape[0]}", arr
        
        if arr.shape[1] != EXPECTED_FEATURES:
            return False, f"Expected {EXPECTED_FEATURES} features, got {arr.shape[1]}", arr
        
        # Check for NaN/Inf
        if np.any(np.isnan(arr)):
            return False, "Input contains NaN values", arr
        
        if np.any(np.isinf(arr)):
            return False, "Input contains infinite values", arr
        
        # Check for reasonable value ranges (optional: ±100 m/s²)
        if np.any(np.abs(arr) > 100):
            logger.warning(f"Input values outside typical range: min={arr.min():.2f}, max={arr.max():.2f}")
        
        return True, "", arr
        
    except Exception as e:
        return False, f"Input validation error: {str(e)}", None


# ====== HEALTH CHECK ======
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "stage1_model_loaded": stage1_model is not None,
        "stage2_model_loaded": stage2_model is not None
    }


# ====== PREDICTION ENDPOINT ======
@app.post("/predict", response_model=HazardPrediction)
async def predict(sensor: SensorReading):
    """
    Predict hazard from sensor data using 2-stage cascade.
    
    Stage 1: Classify as Normal or Hazard
    Stage 2 (if hazard): Classify as Speedbreaker or Pothole
    """
    start_time = time.time()
    
    try:
        # Validate input
        is_valid, error_msg, data_array = validate_input(sensor.data)
        if not is_valid:
            logger.warning(f"Input validation failed: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Add batch dimension for inference
        data_batch = np.expand_dims(data_array, axis=0)
        
        # ====== STAGE 1: NORMAL VS HAZARD ======
        if stage1_model is None:
            raise HTTPException(status_code=503, detail="Stage-1 model not loaded")
        
        try:
            stage1_pred_proba = stage1_model.predict(data_batch, verbose=0)[0][0]
        except Exception as e:
            logger.error(f"Stage-1 inference failed: {e}")
            raise HTTPException(status_code=500, detail="Stage-1 inference failed")
        
        stage1_is_hazard = stage1_pred_proba > THRESHOLD_NORMAL_HAZARD
        stage1_result = "Hazard" if stage1_is_hazard else "Normal"
        stage1_confidence = float(stage1_pred_proba) if stage1_is_hazard else float(1.0 - stage1_pred_proba)
        
        logger.info(f"Stage-1: {stage1_result} (confidence: {stage1_confidence:.4f})")
        
        # ====== STAGE 2: SPEEDBREAKER VS POTHOLE (IF HAZARD) ======
        stage2_result = None
        stage2_confidence = None
        
        if stage1_is_hazard:
            if stage2_model is None:
                logger.warning("Hazard detected but Stage-2 model not loaded")
                raise HTTPException(status_code=503, detail="Stage-2 model not loaded")
            
            try:
                stage2_pred_proba = stage2_model.predict(data_batch, verbose=0)[0][0]
            except Exception as e:
                logger.error(f"Stage-2 inference failed: {e}")
                raise HTTPException(status_code=500, detail="Stage-2 inference failed")
            
            is_pothole = stage2_pred_proba > THRESHOLD_SPEEDBREAKER_POTHOLE
            stage2_result = "Pothole" if is_pothole else "Speedbreaker"
            stage2_confidence = float(stage2_pred_proba) if is_pothole else float(1.0 - stage2_pred_proba)
            
            logger.info(f"Stage-2: {stage2_result} (confidence: {stage2_confidence:.4f})")
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        return HazardPrediction(
            stage1_result=stage1_result,
            stage1_confidence=stage1_confidence,
            stage2_result=stage2_result,
            stage2_confidence=stage2_confidence,
            processing_time_ms=processing_time_ms
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        processing_time_ms = (time.time() - start_time) * 1000
        return HazardPrediction(
            stage1_result="Error",
            stage1_confidence=0.0,
            stage2_result=None,
            stage2_confidence=None,
            processing_time_ms=processing_time_ms,
            error=str(e)
        )


# ====== BATCH PREDICTION ENDPOINT ======
class BatchSensorReadings(BaseModel):
    """Batch of sensor readings."""
    readings: List[List[List[float]]]


class BatchPredictions(BaseModel):
    """Batch prediction response."""
    predictions: List[HazardPrediction]
    total_processing_time_ms: float


@app.post("/predict_batch", response_model=BatchPredictions)
async def predict_batch(batch: BatchSensorReadings):
    """
    Batch prediction endpoint for multiple sensor readings.
    """
    start_time = time.time()
    predictions = []
    
    logger.info(f"Processing batch with {len(batch.readings)} readings")
    
    for idx, reading_data in enumerate(batch.readings):
        sensor_reading = SensorReading(data=reading_data)
        prediction = await predict(sensor_reading)
        predictions.append(prediction)
    
    total_time = (time.time() - start_time) * 1000
    logger.info(f"Batch processing complete: {len(predictions)} predictions in {total_time:.2f}ms")
    
    return BatchPredictions(
        predictions=predictions,
        total_processing_time_ms=total_time
    )


# ====== ROOT ENDPOINT ======
@app.get("/")
async def root():
    """API root endpoint with information."""
    return {
        "name": "Road Hazard Detection API",
        "version": "2.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict (POST)",
            "predict_batch": "/predict_batch (POST)",
            "docs": "/docs"
        },
        "models": {
            "stage1": "stage1_binary_v2.keras" if stage1_model else "NOT LOADED",
            "stage2": "stage2_subtype_v2.keras" if stage2_model else "NOT LOADED"
        }
    }


# ====== STARTUP/SHUTDOWN ======
@app.on_event("startup")
async def startup_event():
    """Log startup information."""
    logger.info("=" * 70)
    logger.info("ROAD HAZARD DETECTION API STARTED")
    logger.info("=" * 70)
    logger.info(f"Python: {sys.version}")
    logger.info(f"TensorFlow: {tf.__version__}")
    logger.info(f"Stage-1 Model: {'LOADED' if stage1_model else 'FAILED'}")
    logger.info(f"Stage-2 Model: {'LOADED' if stage2_model else 'FAILED'}")
    logger.info("=" * 70)


@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown information."""
    logger.info("Road Hazard Detection API shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
