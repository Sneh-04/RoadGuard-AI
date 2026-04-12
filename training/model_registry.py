"""
RoadGuard — Singleton model loader.
Models are loaded once at application startup and reused across requests.
"""
from __future__ import annotations

import threading
from pathlib import Path
from typing import Any, Optional

import numpy as np
from numpy.typing import NDArray

from backend.core.config import settings
from backend.core.logging import get_logger

log = get_logger(__name__)

_lock = threading.Lock()


class ModelRegistry:
    """Thread-safe singleton holding all ML models."""

    _instance: Optional["ModelRegistry"] = None

    def __new__(cls) -> "ModelRegistry":
        with _lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._loaded = False
                cls._instance._stage1 = None
                cls._instance._stage2 = None
                cls._instance._yolo = None
        return cls._instance

    # ── Loading ───────────────────────────────────────────────────────────────

    def load_all(self) -> None:
        if self._loaded:
            return
        with _lock:
            if self._loaded:
                return
            log.info("Loading RoadGuard models...")
            self._stage1 = self._load_keras(settings.STAGE1_MODEL_PATH)
            self._stage2 = self._load_keras(settings.STAGE2_MODEL_PATH)
            self._yolo = self._load_yolo(settings.YOLO_MODEL_PATH)
            self._loaded = True
            log.info(
                "Models loaded",
                stage1=self._stage1 is not None,
                stage2=self._stage2 is not None,
                yolo=self._yolo is not None,
            )

    @staticmethod
    def _load_keras(path: Path) -> Any | None:
        if not path.exists():
            log.warning("Keras model not found", path=str(path))
            return None
        try:
            import keras
            model = keras.models.load_model(str(path))
            log.info("Keras model loaded", path=path.name)
            return model
        except Exception as exc:
            log.error("Failed to load Keras model", path=str(path), error=str(exc))
            return None

    @staticmethod
    def _load_yolo(path: Path) -> Any | None:
        if not path.exists():
            log.warning("YOLO model not found", path=str(path))
            return None
        try:
            from ultralytics import YOLO
            model = YOLO(str(path))
            log.info("YOLO model loaded", path=path.name)
            return model
        except Exception as exc:
            log.error("Failed to load YOLO model", path=str(path), error=str(exc))
            return None

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict_stage1(self, segment: NDArray[np.float32]) -> float:
        """
        Stage 1: hazard presence.
        Returns probability of hazard (class 1).
        Input shape: (T, 3) → expanded to (1, T, 3).
        """
        if self._stage1 is None:
            raise RuntimeError("Stage-1 model not loaded")
        x = segment[np.newaxis, :, :]          # (1, 100, 3)
        prob = float(self._stage1.predict(x, verbose=0)[0][0])
        return prob

    def predict_stage2(self, segment: NDArray[np.float32]) -> float:
        """
        Stage 2: hazard type (Speed Breaker vs Pothole).
        Returns probability of Pothole (class 1 = Pothole).
        """
        if self._stage2 is None:
            raise RuntimeError("Stage-2 model not loaded")
        x = segment[np.newaxis, :, :]
        prob = float(self._stage2.predict(x, verbose=0)[0][0])
        return prob

    def predict_yolo(self, image_bytes: bytes) -> float:
        """
        YOLO inference.
        Returns max confidence across hazard detections (0.0 if no detection).
        """
        if self._yolo is None:
            log.warning("YOLO model unavailable — returning 0.0")
            return 0.0
        import cv2
        import numpy as np

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return 0.0

        img_resized = cv2.resize(img, (settings.YOLO_INPUT_SIZE, settings.YOLO_INPUT_SIZE))
        results = self._yolo.predict(
            source=img_resized,
            verbose=False,
            conf=0.1,
        )
        confidences = []
        for r in results:
            if r.boxes is not None and len(r.boxes):
                confidences.extend(r.boxes.conf.cpu().numpy().tolist())

        return float(max(confidences)) if confidences else 0.0

    # ── Status ────────────────────────────────────────────────────────────────

    @property
    def status(self) -> dict[str, bool]:
        return {
            "stage1": self._stage1 is not None,
            "stage2": self._stage2 is not None,
            "yolo": self._yolo is not None,
        }


# Global singleton
registry = ModelRegistry()
