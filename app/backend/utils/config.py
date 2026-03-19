"""Backend configuration - pathlib-based for cross-platform compatibility."""
import os
from pathlib import Path

# ============================================================================
# PROJECT PATHS - Using pathlib for cross-platform compatibility
# ============================================================================

# Get the project root by going up 2 levels from this file:
# app/backend/config.py -> app/backend -> app -> project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Model directory - use environment variable or default
MODEL_DIR = Path("/Users/pawankumar/Desktop/RoadHazardProject/models")

# ============================================================================
# MODEL PATHS - Production models
# ============================================================================

# Stage 1: Normal vs Hazard detection (binary classification)
STAGE1_MODEL_PATH = str(MODEL_DIR / "stage1_binary_v2.keras")

# Stage 2: Speedbreaker vs Pothole classification (binary, if hazard detected)
STAGE2_MODEL_PATH = str(MODEL_DIR / "stage2_subtype_v2.keras")

# Vision: YOLOv8 model for hazard detection
VISION_MODEL_PATH = str(MODEL_DIR / "best.pt")

# ============================================================================
# DEVICE CONFIGURATION
# ============================================================================

DEVICE = os.environ.get("DEVICE", "auto")  # "auto", "gpu", "cpu"
RANDOM_SEED = 42

# ============================================================================
# API CONFIGURATION
# ============================================================================

API_TITLE = "RoadHazardProject API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Two-stage cascaded CNN for road hazard detection from accelerometer data"

# ============================================================================
# AUTHENTICATION CONFIGURATION
# ============================================================================


JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

# ============================================================================
# EXTERNAL API KEYS
# ============================================================================
JWT_SECRET        = "roadguard-2024-secret-xyz"        # any long random string
ANTHROPIC_API_KEY = "sk-ant-..."                        # console.anthropic.com
OPENAI_API_KEY    = "sk-..."                            # platform.openai.com (Whisper)
OPENWEATHER_API_KEY = "..."                             # openweathermap.org/api (free)

# ============================================================================
# PREPROCESSING CONFIGURATION
# ============================================================================

WINDOW_SIZE = 10  # SMA window size
SPIKE_THRESHOLD_K = 2.5  # Spike detection multiplier
SAMPLING_FREQ = 50  # Hz
SEGMENT_LENGTH_T = 100  # Timesteps per segment
FUSION_ALPHA = 0.6  # Sensor fusion weight
VISION_CONF_THRESHOLD = 0.5  # Vision confidence threshold
STAGE2_THRESHOLD = 0.5  # Stage 2 classification threshold

# ============================================================================
# DEDUPLICATION CONFIGURATION
# ============================================================================

SPATIAL_DEDUP_RADIUS_M = 50.0  # Meters
TEMPORAL_DEDUP_WINDOW_SEC = 60.0  # Seconds

# ============================================================================
# MODEL INFERENCE SETTINGS
# ============================================================================

INFERENCE_TIMEOUT = 30  # seconds
MODEL_BATCH_SIZE = 1  # Single sample inference

# ============================================================================
# LOGGING
# ============================================================================

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

# ============================================================================
# STARTUP VALIDATION
# ============================================================================

HEALTH_CHECK_ON_STARTUP = True
VERIFY_MODELS_ON_STARTUP = True
