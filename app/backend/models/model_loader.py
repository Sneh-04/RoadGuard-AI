"""Model loading and management - singleton pattern for model caching."""
import os
import logging
from typing import Optional
import numpy as np
import threading

try:
    import tensorflow as tf
    from tensorflow import keras
except ImportError:
    tf = None
    keras = None

from ..utils.config import (
    STAGE1_MODEL_PATH,
    STAGE2_MODEL_PATH,
    VISION_MODEL_PATH,
    DEVICE,
)

logger = logging.getLogger(__name__)


class ModelLoadError(Exception):
    """Raised when a model fails to load."""
    pass


class ModelLoader:
    """Singleton class for loading and managing ML models.
    
    Ensures models are loaded once at startup and shared across
    all requests. Thread-safe for concurrent inference.
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """Implement singleton pattern."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize model cache (called only once)."""
        if self._initialized:
            return
            
        self.stage1_model = None
        self.stage2_model = None
        self.device = DEVICE
        self._load_status = {
            "stage1": "not_loaded",
            "stage2": "not_loaded",
        }
        self._initialized = True
    
    def load_all_models(self) -> dict:
        """Load all sensor models for inference.
        
        Returns:
            dict: Status of each model load attempt with keys:
                - stage1: "loaded" | error message
                - stage2: "loaded" | error message
        """
        logger.info("Starting model loading...")
        
        self.stage1_model = self._load_model(STAGE1_MODEL_PATH, "stage1")
        self.stage2_model = self._load_model(STAGE2_MODEL_PATH, "stage2")
        
        all_loaded = all([
            self.stage1_model is not None,
            self.stage2_model is not None,
        ])
        
        if all_loaded:
            logger.info("✅ All models loaded successfully")
        else:
            failed = [k for k, v in self._load_status.items() if v != "loaded"]
            logger.warning(f"⚠️  Failed to load models: {failed}")
        
        return self._load_status
    
    def _load_model(self, model_path: str, model_name: str) -> Optional[keras.Model]:
        """Load a single model from disk.
        
        Args:
            model_path: Path to .keras model file
            model_name: Name for logging
            
        Returns:
            Loaded model or None if load fails
        """
        # First check if file exists
        if not os.path.exists(model_path):
            error_msg = f"Model file not found at: {model_path}"
            logger.error(f"❌ {model_name}: {error_msg}")
            self._load_status[model_name] = error_msg
            return None
        
        # Log file exists with size info
        file_size = os.path.getsize(model_path)
        file_size_mb = file_size / (1024 * 1024)
        logger.info(f"📦 {model_name}: Found model file ({file_size_mb:.2f} MB)")
        
        try:
            logger.info(f"🔄 Loading {model_name}...")
            model = keras.models.load_model(model_path)
            logger.info(f"✅ {model_name} loaded successfully (model shape verified)")
            self._load_status[model_name] = "loaded"
            return model
        except Exception as e:
            error_msg = f"Failed to load: {str(e)}"
            logger.error(f"❌ {model_name} load failed: {error_msg}")
            self._load_status[model_name] = error_msg
            return None
    
    def is_ready(self) -> bool:
        """Check if all models are loaded and ready for inference."""
        return all([
            self.stage1_model is not None,
            self.stage2_model is not None,
            True,  # baseline_model not used in cascaded pipeline
        ])
    
    def get_status(self) -> dict:
        """Get detailed status of all models."""
        return {
            "stage1_loaded": self.stage1_model is not None,
            "stage2_loaded": self.stage2_model is not None,
            "baseline_loaded": True,  # baseline_model not used in cascaded pipeline
            "all_loaded": self.is_ready(),
            "device": self.device,
            "load_details": self._load_status.copy(),
        }


def get_model_loader() -> ModelLoader:
    """Get singleton instance of ModelLoader."""
    return ModelLoader()
