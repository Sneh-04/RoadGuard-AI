"""Inference pipeline for multimodal hazard detection."""
import logging
import numpy as np
from typing import Tuple, Dict, Optional, Union

from ..models.model_loader import get_model_loader
from ..vision.vision_inference import get_vision_pipeline, VisionInferenceError
from ..fusion.fusion import get_fusion_pipeline, FusionResult, FusionError
from ..preprocessing.preprocess import preprocess_accel
from ..utils.schemas import HazardType, PredictionResponse

logger = logging.getLogger(__name__)


class InferenceError(Exception):
    """Raised when inference fails."""
    pass


class HazardInferencePipeline:
    """Multimodal inference pipeline for road hazard detection.
    
    Supports:
    - Sensor-only: Two-stage cascaded classification
    - Vision-only: YOLO-based image detection
    - Multimodal: Sensor + vision fusion
    """
    
    # Class indices for model outputs
    STAGE1_NORMAL = 0
    STAGE1_HAZARD = 1
    
    STAGE2_POTHOLE = 0
    STAGE2_SPEEDBREAKER = 1
    
    def __init__(self):
        """Initialize pipeline with loaded models."""
        self.loader = get_model_loader()
        
        # Initialize vision pipeline - may not be available
        try:
            self.vision_pipeline = get_vision_pipeline()
        except Exception as e:
            logger.warning(f"Vision pipeline initialization failed: {e}")
            self.vision_pipeline = None
        
        try:
            self.fusion_pipeline = get_fusion_pipeline()
        except Exception as e:
            logger.warning(f"Fusion pipeline initialization failed: {e}")
            self.fusion_pipeline = None
        
        # Sensor models are required
        if not self.loader.is_ready():
            logger.warning("Sensor models not loaded - inference will be degraded")
    
    def predict_sensor(self, data: list[list[float]]) -> PredictionResponse:
        """Run sensor-only inference pipeline.
        
        Args:
            data: Input data in shape (100, 3) as list[list[float]]
            
        Returns:
            PredictionResponse with hazard classification and confidence scores
        """
        return self._predict_sensor_internal(data)
    
    def predict_vision(self, image_data: bytes) -> Dict[str, Union[str, float]]:
        """Run vision-only inference.
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Dict with hazard_type and confidence
        """
        try:
            hazard_type, confidence = self.vision_pipeline.predict_image(image_data)
            return {
                "hazard_type": hazard_type,
                "confidence": confidence
            }
        except VisionInferenceError as e:
            raise InferenceError(f"Vision inference failed: {e}")
    
    def predict_multimodal(self, sensor_data: list[list[float]], 
                          image_data: bytes) -> Dict[str, Union[bool, str, float]]:
        """Run multimodal sensor-vision fusion inference.
        
        Args:
            sensor_data: Accelerometer data (100, 3)
            image_data: Image bytes
            
        Returns:
            Dict with fused prediction results
        """
        try:
            # Run sensor inference
            sensor_result = self._predict_sensor_internal(sensor_data)
            sensor_dict = {
                "hazard_detected": sensor_result.hazard_type != 0,
                "hazard_type": sensor_result.hazard_type,
                "confidence": sensor_result.confidence
            }
            
            # Run vision inference
            vision_result = self.vision_pipeline.predict_image(image_data)
            
            # Fuse predictions
            fusion_result = self.fusion_pipeline.fuse_predictions(sensor_dict, vision_result)
            
            return {
                "hazard_detected": fusion_result.hazard_type != 0,
                "hazard_type": fusion_result.hazard_type,
                "final_confidence": fusion_result.confidence,
                "sensor_confidence": fusion_result.sensor_confidence,
                "vision_confidence": fusion_result.vision_confidence,
                "severity_score": fusion_result.confidence  # Use fused confidence as severity
            }
            
        except (InferenceError, VisionInferenceError, FusionError) as e:
            raise InferenceError(f"Multimodal inference failed: {e}")
    
    def predict_batch(self, sensor_batch: list[list[list[float]]], 
                     image_batch: Optional[list[bytes]] = None) -> list[Dict]:
        """Run batch inference on multiple samples.
        
        Args:
            sensor_batch: List of sensor data samples
            image_batch: Optional list of image data (same length as sensor_batch)
            
        Returns:
            List of prediction results
        """
        results = []
        for i, sensor_data in enumerate(sensor_batch):
            try:
                if image_batch and i < len(image_batch):
                    # Multimodal
                    result = self.predict_multimodal(sensor_data, image_batch[i])
                else:
                    # Sensor-only
                    response = self.predict_sensor(sensor_data)
                    result = {
                        "hazard_detected": response.hazard_detected,
                        "hazard_type": response.hazard_type.value if response.hazard_type else None,
                        "final_confidence": response.confidence,
                        "sensor_confidence": response.confidence,
                        "vision_confidence": None,
                        "severity_score": response.severity_score
                    }
                results.append(result)
            except InferenceError as e:
                logger.error(f"Batch prediction failed for sample {i}: {e}")
                results.append({
                    "error": str(e),
                    "hazard_detected": False,
                    "hazard_type": None,
                    "final_confidence": 0.0
                })
        
        return results
    
    def _predict_sensor_internal(self, data: list[list[float]]) -> PredictionResponse:
        """Internal sensor prediction logic."""
        try:
            # Convert to numpy for preprocessing
            raw_array = np.array(data, dtype=np.float32)
            
            # Apply preprocessing pipeline
            processed = preprocess_accel(raw_array)
            if processed is None:
                # No spike detected, classify as Normal immediately
                return PredictionResponse(
                    hazard_detected=False,
                    hazard_type=HazardType.NORMAL,
                    confidence=0.0,  # No hazard confidence
                    stage2_confidence=None,
                    severity_score=0.0
                )
            
            # Convert back to list for _prepare_input (expects list)
            processed_data = processed.tolist()
            
            # Convert and validate input
            input_array = self._prepare_input(processed_data)
            
            # Stage 1: Normal vs Hazard
            stage1_output = self.loader.stage1_model.predict(
                input_array,
                verbose=0
            )
            stage1_prob = float(stage1_output[0][0])
            hazard_detected = stage1_prob > 0.5
            
            logger.debug(f"Stage 1 output: {stage1_prob:.4f}, Hazard: {hazard_detected}")
            
            # Stage 2: Speedbreaker vs Pothole (only if hazard detected)
            hazard_type = HazardType.NORMAL
            stage2_prob = None
            
            if hazard_detected:
                stage2_output = self.loader.stage2_model.predict(
                    input_array,
                    verbose=0
                )
                stage2_prob = float(stage2_output[0][0])
                
                # Threshold of 0.5: 0 = Speedbreaker, 1 = Pothole
                if stage2_prob > 0.5:
                    hazard_type = HazardType.POTHOLE
                else:
                    hazard_type = HazardType.SPEEDBREAKER
                
                logger.debug(f"Stage 2 output: {stage2_prob:.4f}, Type: {hazard_type}")
            
            # Calculate severity score
            severity_score = self._calculate_severity(
                hazard_detected,
                stage1_prob,
                stage2_prob
            )
            
            # Build response
            response = PredictionResponse(
                hazard_detected=hazard_detected,
                hazard_type=hazard_type,
                confidence=stage1_prob,
                stage2_confidence=stage2_prob,
                severity_score=severity_score,
            )
            
            logger.info(
                f"Prediction: [Hazard: {hazard_detected}, "
                f"Type: {hazard_type}, Severity: {severity_score:.3f}]"
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Sensor inference failed: {e}")
            raise InferenceError(f"Sensor inference failed: {e}")
    
    def _prepare_input(self, data: list[list[float]]) -> np.ndarray:
        """Prepare and validate input data for model inference.
        
        Args:
            data: Input in shape (100, 3)
            
        Returns:
            Numpy array in shape (1, 100, 3) ready for model.predict()
            
        Raises:
            InferenceError: If shape validation fails
        """
        try:
            # Convert to numpy array
            arr = np.array(data, dtype=np.float32)
            
            # Validate shape
            if arr.shape != (100, 3):
                raise InferenceError(
                    f"Expected shape (100, 3), got {arr.shape}. "
                    f"Input must be 100 timesteps × 3 axes (X, Y, Z)."
                )
            
            # Add batch dimension: (100, 3) → (1, 100, 3)
            batch_input = np.expand_dims(arr, axis=0)
            
            return batch_input
            
        except ValueError as e:
            raise InferenceError(f"Invalid input data: {str(e)}")
    
    def _calculate_severity(
        self,
        hazard_detected: bool,
        stage1_prob: float,
        stage2_prob: Optional[float]
    ) -> float:
        """Calculate overall severity score (0.0-1.0).
        
        Severity combines:
        - How confident stage 1 is that it's a hazard
        - Stage 2 confidence if hazard is detected
        
        Args:
            hazard_detected: Whether stage 1 detected hazard
            stage1_prob: Stage 1 model probability (0.0-1.0)
            stage2_prob: Stage 2 model probability if hazard (0.0-1.0)
            
        Returns:
            Severity score (0.0-1.0)
        """
        if not hazard_detected:
            # Normal road: severity is inverse of stage 1 confidence
            return 1.0 - stage1_prob
        
        if stage2_prob is None:
            # Hazard detected but stage 2 not run
            return stage1_prob
        
        # Hazard detected: combine stage 1 and stage 2 confidence
        # Higher stage 2 probability = more likely speedbreaker (higher severity)
        # Lower stage 2 probability = more likely pothole (lower severity)
        combined = (stage1_prob + stage2_prob) / 2.0
        return combined


# internal singleton reference for pipeline once created by startup
_global_pipeline: Optional[HazardInferencePipeline] = None


def set_inference_pipeline(pipeline: HazardInferencePipeline) -> None:
    """Register the pipeline instance for global access.

    This should be called once during application startup after models
    have been successfully loaded. Subsequent calls to
    :func:`get_inference_pipeline` will return the same object.
    """
    global _global_pipeline
    _global_pipeline = pipeline


def get_inference_pipeline() -> HazardInferencePipeline:
    """Retrieve the initialized inference pipeline.

    Raises:
        InferenceError: If the pipeline has not been initialized (e.g. "
            models not loaded or startup failed).
    """
    if _global_pipeline is None:
        # do not automatically instantiate here - caller should ensure
        # proper initialization at startup to avoid per-request loading
        raise InferenceError(
            "Inference pipeline not initialized. "
            "Ensure models were loaded at startup and pipeline created."
        )
    return _global_pipeline
