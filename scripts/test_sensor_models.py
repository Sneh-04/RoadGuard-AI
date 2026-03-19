import numpy as np
import tensorflow as tf
import os
from tensorflow.keras.layers import InputLayer
from config import MODEL_DIR, RESULTS_DIR

# Paths — use centralized config
STAGE1_PATH = os.path.join(MODEL_DIR, "stage1_normal_vs_hazard.keras")
STAGE2_PATH = os.path.join(MODEL_DIR, "stage2_speedbreaker_vs_pothole.keras")

USE_REAL_DATA = False
REAL_DATA_PATH = os.path.join("data", "processed_accel_only_fixed", "X_test.npy")

EXPORT_SAVEDMODEL = True
SAVEDMODEL_STAGE1 = os.path.join(RESULTS_DIR, "saved_models", "sensor", "stage1")
SAVEDMODEL_STAGE2 = os.path.join(RESULTS_DIR, "saved_models", "sensor", "stage2")

# ----------------------------
# FIX InputLayer ISSUE FOR STAGE2
# ----------------------------
class MyInputLayer(InputLayer):
    def __init__(self, *args, **kwargs):
        kwargs.pop("optional", None)
        kwargs.pop("batch_shape", None)
        super().__init__(*args, **kwargs)

# ----------------------------
# LOAD MODELS
# ----------------------------
print("Loading Stage 1 model...")
stage1_model = tf.keras.models.load_model(STAGE1_PATH, compile=False)

print("Loading Stage 2 model (with InputLayer fix)...")
stage2_model = tf.keras.models.load_model(
    STAGE2_PATH,
    compile=False,
    custom_objects={"InputLayer": MyInputLayer}
)

print("Stage 1 input shape:", stage1_model.input_shape)
print("Stage 2 input shape:", stage2_model.input_shape)

# ----------------------------
# PREPARE INPUT
# ----------------------------
if USE_REAL_DATA and os.path.exists(REAL_DATA_PATH):
    print(f"Loading real test data from {REAL_DATA_PATH}")
    sample_input = np.load(REAL_DATA_PATH)
    sample_input = sample_input[0:1]  # first sample
else:
    # Create dummy input matching Stage1 input
    input_shape = stage1_model.input_shape
    if len(input_shape) == 2:  # (None, features)
        sample_input = np.random.rand(1, input_shape[1])
    elif len(input_shape) == 3:  # (None, timesteps, features)
        sample_input = np.random.rand(1, input_shape[1], input_shape[2])
    else:
        raise ValueError(f"Unknown input shape: {input_shape}")

print("Sample input shape:", sample_input.shape)

# ----------------------------
# STAGE 1 PREDICTION
# ----------------------------
stage1_pred = stage1_model.predict(sample_input)
stage1_class = np.argmax(stage1_pred, axis=1)[0]  # assuming one-hot
print("Stage 1 Prediction (0=Normal,1=Hazard):", stage1_class)

# ----------------------------
# STAGE 2 PREDICTION
# ----------------------------
if stage1_class == 1:  # Hazard detected
    stage2_pred = stage2_model.predict(sample_input)
    stage2_class = np.argmax(stage2_pred, axis=1)[0]
    print("Stage 2 Prediction (0=Pothole,1=Speedbreaker):", stage2_class)
else:
    print("No hazard detected in Stage 1.")

# ----------------------------
# EXPORT TO SAVEDMODEL
# ----------------------------
if EXPORT_SAVEDMODEL:
    os.makedirs(SAVEDMODEL_STAGE1, exist_ok=True)
    os.makedirs(SAVEDMODEL_STAGE2, exist_ok=True)

    print(f"Exporting Stage 1 model to {SAVEDMODEL_STAGE1} ...")
    stage1_model.save(SAVEDMODEL_STAGE1)

    print(f"Exporting Stage 2 model to {SAVEDMODEL_STAGE2} ...")
    stage2_model.save(SAVEDMODEL_STAGE2)

    print("✅ Models exported successfully!")
