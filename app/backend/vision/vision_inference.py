"""Vision inference pipeline for YOLO-based hazard detection."""
import logging
import numpy as np
from typing import Optional, Tuple

# Safe YOLO import - don't crash server if unavailable
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO = None
    YOLO_AVAILABLE = False

import cv2

from ..utils.config import VISION_MODEL_PATH

logger = logging.getLogger(__name__)


class VisionInferenceError(Exception):
    """Raised when vision inference fails."""
    pass


class VisionInferencePipeline:
    """YOLO-based vision pipeline for road hazard detection.
    
    Uses Ultralytics YOLOv8 for object detection on road images.
    Detects hazards like potholes, speedbreakers, etc.
    """
    
    # Hazard class mappings (adjust based on YOLO model training)
    HAZARD_CLASSES = {
        0: "pothole",
        1: "speedbreaker",
        2: "crack",
        3: "manhole",
    }
    
    def __init__(self):
        """Initialize vision pipeline."""
        self.model = None
        self.available = YOLO_AVAILABLE
        
        if not YOLO_AVAILABLE:
            logger.warning("⚠️  YOLO is not available - vision inference disabled")
            return
        
        self._load_model()
    
    def _load_model(self):
        """Load YOLO model from disk."""
        try:
            logger.info(f"Loading vision model from {VISION_MODEL_PATH}")
            self.model = YOLO(VISION_MODEL_PATH)
            logger.info("✅ Vision model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load vision model: {e}")
            self.model = None
            self.available = False
    
    def predict_image(self, image_data: bytes) -> Tuple[str, float]:
        """Run inference on image data.
        
        Args:
            image_data: Raw image bytes (JPEG/PNG)
            
        Returns:
            Tuple of (hazard_type, confidence_score)
            
        Raises:
            VisionInferenceError: If inference fails
        """
        if not self.available or self.model is None:
            logger.warning("Vision model not available - returning default")
            return "normal", 0.0
        
        try:
            # Decode image
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise VisionInferenceError("Invalid image data")
            
            # Run inference
            results = self.model(image, verbose=False)
            
            # Process results
            if len(results) == 0 or len(results[0].boxes) == 0:
                # No detections
                return "normal", 0.0
            
            # Get best detection
            boxes = results[0].boxes
            best_conf = float(boxes.conf[0])
            best_class = int(boxes.cls[0])
            
            # Map to hazard type
            hazard_type = self.HAZARD_CLASSES.get(best_class, "unknown")
            
            logger.debug(f"Vision detection: {hazard_type} ({best_conf:.3f})")
            
            return hazard_type, best_conf
            
        except Exception as e:
            logger.error(f"Vision inference failed: {e}")
            return "normal", 0.0
    
    def is_ready(self) -> bool:
        """Check if vision model is loaded and ready."""
        return self.available and self.model is not None


# Global vision pipeline instance
_vision_pipeline = None

def get_vision_pipeline() -> VisionInferencePipeline:
    """Get singleton vision pipeline instance."""
    global _vision_pipeline
    if _vision_pipeline is None:
        _vision_pipeline = VisionInferencePipeline()
    return _vision_pipeline