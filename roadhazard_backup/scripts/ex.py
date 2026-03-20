import numpy as np
import os
from tensorflow.keras.models import load_model
from config import MODEL_DIR

# --- Load Models ---
STAGE1_H5 = os.path.join(MODEL_DIR, "stage1_normal_vs_hazard.h5")
STAGE2_H5 = os.path.join(MODEL_DIR, "stage2_speedbreaker_vs_pothole.h5")

stage1_model = load_model(STAGE1_H5, compile=False)
stage2_model = load_model(STAGE2_H5, compile=False)

print("✅ Both Stage-1 and Stage-2 models loaded successfully!")

# --- Example input (100 timesteps, 3 features) ---
dummy_input = np.random.rand(1, 100, 3).astype(np.float32)

# --- Stage-1 Prediction ---
stage1_pred = stage1_model.predict(dummy_input)
stage1_label = "Hazard" if stage1_pred[0][0] > 0.5 else "Normal"
print(f"Stage-1 Prediction: {stage1_label} ({stage1_pred[0][0]:.3f})")

# --- Stage-2 Prediction (only if hazard detected) ---
if stage1_label == "Hazard":
    stage2_pred = stage2_model.predict(dummy_input)
    # Assuming Stage-2 has n classes, take argmax
    stage2_class = np.argmax(stage2_pred, axis=1)[0]
    print(f"Stage-2 Hazard Type Prediction: Class {stage2_class} ({stage2_pred[0]})")
else:
    print("No hazard detected, skipping Stage-2.")
