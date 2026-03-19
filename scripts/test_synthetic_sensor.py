import tensorflow as tf
import numpy as np
import os
from config import MODEL_DIR

# -----------------------------
# Patch InputLayer to ignore unsupported args
# -----------------------------
original_input_layer = tf.keras.layers.InputLayer

def patched_input_layer(*args, **kwargs):
    kwargs.pop("batch_shape", None)
    kwargs.pop("optional", None)
    return original_input_layer(*args, **kwargs)

tf.keras.layers.InputLayer = patched_input_layer

# -----------------------------
# Paths to your models
# -----------------------------
STAGE1_PATH = os.path.join(MODEL_DIR, "stage1_normal_vs_hazard.keras")
STAGE2_PATH = os.path.join(MODEL_DIR, "stage2_speedbreaker_vs_pothole.keras")

# -----------------------------
# Load models safely
# -----------------------------
print("Loading Stage-1 model...")
stage1_model = tf.keras.models.load_model(STAGE1_PATH, compile=False)
print("✅ Stage-1 model loaded successfully\n")
stage1_model.summary()

print("\nLoading Stage-2 model...")
stage2_model = tf.keras.models.load_model(STAGE2_PATH, compile=False)
print("✅ Stage-2 model loaded successfully\n")
stage2_model.summary()

# -----------------------------
# Test with dummy synthetic data
# -----------------------------
# Stage-1: Normal vs Hazard
dummy_input_stage1 = np.random.rand(1, 100, 3).astype('float32')
pred_stage1 = stage1_model.predict(dummy_input_stage1)
print("\nStage-1 prediction (Normal vs Hazard):", pred_stage1)

# Stage-2: Speedbump vs Pothole (only test if hazard)
dummy_input_stage2 = np.random.rand(1, 100, 3).astype('float32')
pred_stage2 = stage2_model.predict(dummy_input_stage2)
print("Stage-2 prediction (Speedbump vs Pothole):", pred_stage2)
