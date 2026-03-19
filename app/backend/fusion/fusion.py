"""Sensor-vision fusion module for probabilistic late fusion."""
import logging
from typing import Dict, Any, Optional, Tuple
from enum import Enum

logger = logging.getLogger(__name__)


class FusionError(Exception):
    """Raised when fusion fails."""
    pass


class HazardType(int, Enum):
    """Unified hazard types across modalities."""
    NORMAL = 0
    SPEEDBREAKER = 1
    POTHOLE = 2
    CRACK = 3
    MANHOLE = 4
    UNKNOWN = -1


class FusionResult:
    """Result of sensor-vision fusion."""
    
    def __init__(self, hazard_type: HazardType, confidence: float, 
                 sensor_conf: float, vision_conf: float, fusion_weight: float):
        self.hazard_type = hazard_type
        self.confidence = confidence
        self.sensor_confidence = sensor_conf
        self.vision_confidence = vision_conf
        self.fusion_weight = fusion_weight


class ProbabilisticFusion:
    """Probabilistic late fusion for sensor and vision modalities.
    
    Implements the research paper formula:
    P_final = α * P_sensor + (1 - α) * P_vision
    
    Where α is the fusion weight (default 0.6 favoring sensor data).
    """
    
    DEFAULT_FUSION_WEIGHT = 0.6  # Favor sensor data
    
    # Hazard type mapping for consistency
    HAZARD_MAPPING = {
        # Sensor types
        "pothole": HazardType.POTHOLE,
        "speedbreaker": HazardType.SPEEDBREAKER,
        # Vision types
        "crack": HazardType.CRACK,
        "manhole": HazardType.MANHOLE,
        # Common
        "normal": HazardType.NORMAL,
        0: HazardType.NORMAL,
        1: HazardType.SPEEDBREAKER,
        2: HazardType.POTHOLE,
    }
    
    def __init__(self, fusion_weight: float = DEFAULT_FUSION_WEIGHT):
        """Initialize fusion with weight.
        
        Args:
            fusion_weight: Weight for sensor modality (0.0-1.0)
        """
        if not 0.0 <= fusion_weight <= 1.0:
            raise ValueError("Fusion weight must be between 0.0 and 1.0")
        
        self.fusion_weight = fusion_weight
        logger.info(f"Initialized fusion with weight α={fusion_weight}")
    
    def fuse_predictions(self, sensor_result: Dict[str, Any], 
                        vision_result: Tuple[str, float]) -> FusionResult:
        """Fuse sensor and vision predictions.
        
        Args:
            sensor_result: Dict with keys: hazard_detected, hazard_type, confidence
            vision_result: Tuple of (hazard_type, confidence)
            
        Returns:
            FusionResult with final prediction
            
        Raises:
            FusionError: If fusion fails
        """
        try:
            # Extract sensor data
            sensor_hazard = sensor_result.get("hazard_type", "normal")
            sensor_conf = sensor_result.get("confidence", 0.0)
            sensor_detected = sensor_result.get("hazard_detected", False)
            
            # Extract vision data
            vision_hazard, vision_conf = vision_result
            
            # Normalize hazard types
            sensor_type = self._normalize_hazard_type(sensor_hazard)
            vision_type = self._normalize_hazard_type(vision_hazard)
            
            # If sensor says normal, use vision if confident
            if not sensor_detected:
                if vision_conf > 0.5:  # Vision threshold
                    final_type = vision_type
                    final_conf = vision_conf
                else:
                    final_type = HazardType.NORMAL
                    final_conf = 1.0 - max(sensor_conf, vision_conf)
            else:
                # Both modalities detect hazard - fuse
                final_type = self._resolve_conflict(sensor_type, vision_type, 
                                                  sensor_conf, vision_conf)
                final_conf = self._fuse_confidences(sensor_conf, vision_conf)
            
            logger.debug(f"Fusion: Sensor({sensor_type}:{sensor_conf:.3f}) + "
                        f"Vision({vision_type}:{vision_conf:.3f}) → "
                        f"{final_type}:{final_conf:.3f}")
            
            return FusionResult(
                hazard_type=final_type,
                confidence=final_conf,
                sensor_confidence=sensor_conf,
                vision_confidence=vision_conf,
                fusion_weight=self.fusion_weight
            )
            
        except Exception as e:
            logger.error(f"Fusion failed: {e}")
            raise FusionError(f"Fusion failed: {e}")
    
    def _normalize_hazard_type(self, hazard_type) -> HazardType:
        """Normalize hazard type to unified enum."""
        if isinstance(hazard_type, int):
            return self.HAZARD_MAPPING.get(hazard_type, HazardType.UNKNOWN)
        elif isinstance(hazard_type, str):
            return self.HAZARD_MAPPING.get(hazard_type.lower(), HazardType.UNKNOWN)
        else:
            return HazardType.UNKNOWN
    
    def _resolve_conflict(self, sensor_type: HazardType, vision_type: HazardType,
                         sensor_conf: float, vision_conf: float) -> HazardType:
        """Resolve conflicts when modalities disagree."""
        # If types match, use that type
        if sensor_type == vision_type:
            return sensor_type
        
        # If one is normal, use the other
        if sensor_type == HazardType.NORMAL:
            return vision_type
        if vision_type == HazardType.NORMAL:
            return sensor_type
        
        # Different hazard types - use higher confidence
        if sensor_conf > vision_conf:
            return sensor_type
        else:
            return vision_type
    
    def _fuse_confidences(self, sensor_conf: float, vision_conf: float) -> float:
        """Fuse confidence scores using weighted average."""
        return (self.fusion_weight * sensor_conf + 
                (1 - self.fusion_weight) * vision_conf)


# Global fusion instance
_fusion = None

def get_fusion_pipeline(fusion_weight: float = 0.6) -> ProbabilisticFusion:
    """Get singleton fusion pipeline instance."""
    global _fusion
    if _fusion is None or _fusion.fusion_weight != fusion_weight:
        _fusion = ProbabilisticFusion(fusion_weight)
    return _fusion