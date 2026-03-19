# backend_app.py
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
from tensorflow.keras.models import load_model
from fastapi.middleware.cors import CORSMiddleware

# -------------------- Load Models --------------------
import os
from config import MODEL_DIR

STAGE1_H5 = os.path.join(MODEL_DIR, "stage1_normal_vs_hazard.h5")
STAGE2_H5 = os.path.join(MODEL_DIR, "stage2_hazard_classification.h5")

stage1_model = load_model(STAGE1_H5, compile=False)
stage2_model = load_model(STAGE2_H5, compile=False)
print("✅ Both Stage-1 and Stage-2 models loaded successfully!")

# -------------------- Hazard Class Mapping --------------------
hazard_classes = ["Pothole", "Crack", "Bump", "Other"]

# -------------------- FastAPI Setup --------------------
app = FastAPI(title="Road Hazard Detection API")

# Allow cross-origin requests from mobile frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your app's domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Request Model --------------------
class SensorData(BaseModel):
    data: list  # List of [x, y, z] points, shape (timesteps, 3)

# -------------------- Prediction Function --------------------
def predict_hazard(sensor_data: np.ndarray):
    sensor_data = np.expand_dims(sensor_data, axis=0).astype(np.float32)

    # Stage-1: Normal vs Hazard
    stage1_pred = stage1_model.predict(sensor_data)[0][0]

    if stage1_pred > 0.5:
        # Stage-2: Hazard type
        stage2_pred = stage2_model.predict(sensor_data)[0]
        predicted_index = int(np.argmax(stage2_pred))
        predicted_name = hazard_classes[predicted_index]
        return {
            "stage1": "Hazard",
            "stage1_prob": float(stage1_pred),
            "stage2": predicted_name,
            "stage2_prob": float(stage2_pred[predicted_index])
        }
    else:
        return {
            "stage1": "Normal",
            "stage1_prob": float(stage1_pred),
            "stage2": None,
            "stage2_prob": None
        }

# -------------------- API Endpoint --------------------
@app.post("/predict")
async def predict(sensor: SensorData):
    sensor_array = np.array(sensor.data)
    if sensor_array.shape[1] != 3:
        return {"error": "Each sensor reading must have 3 features (x, y, z)"}
    results = predict_hazard(sensor_array)
    return results

# -------------------- Run using: --------------------
#uvicorn backend_app:app --reload --host 0.0.0.0 --port 8000
