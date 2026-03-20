import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv1D,
    BatchNormalization,
    MaxPooling1D,
    GlobalAveragePooling1D,
    Dense,
    Dropout
)
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

# ---------------- CONFIG ----------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed_accel_only_fixed")
from config import MODEL_DIR
os.makedirs(MODEL_DIR, exist_ok=True)

EPOCHS = 50
BATCH_SIZE = 32
LR = 1e-3

# ---------------- LOAD DATA ----------------
X_train = np.load(os.path.join(DATA_DIR, "X_train.npy"))
y_train = np.load(os.path.join(DATA_DIR, "y_train.npy"))

X_val = np.load(os.path.join(DATA_DIR, "X_val.npy"))
y_val = np.load(os.path.join(DATA_DIR, "y_val.npy"))

# ---------------- FILTER HAZARDS ONLY ----------------
# Keep only labels 1 (speedbreaker) and 2 (pothole)
train_mask = np.isin(y_train, [1, 2])
val_mask = np.isin(y_val, [1, 2])

X_train = X_train[train_mask]
y_train = y_train[train_mask]

X_val = X_val[val_mask]
y_val = y_val[val_mask]

# ---------------- REMAP LABELS ----------------
# 1 → 0 (Speedbreaker)
# 2 → 1 (Pothole)
y_train = (y_train == 2).astype(np.int32)
y_val = (y_val == 2).astype(np.int32)

print("Stage-2 X_train shape:", X_train.shape)
print("Stage-2 y_train shape:", y_train.shape)

# ---------------- MODEL ----------------
model = Sequential([
    Conv1D(32, 5, activation="relu", input_shape=X_train.shape[1:]),
    BatchNormalization(),
    MaxPooling1D(2),

    Conv1D(64, 3, activation="relu"),
    BatchNormalization(),
    MaxPooling1D(2),

    Conv1D(128, 3, activation="relu"),
    BatchNormalization(),

    GlobalAveragePooling1D(),

    Dense(64, activation="relu"),
    Dropout(0.4),

    Dense(1, activation="sigmoid")
])

model.compile(
    optimizer=Adam(learning_rate=LR),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ---------------- TRAIN ----------------
callbacks = [
    EarlyStopping(
        monitor="val_loss",
        patience=6,
        restore_best_weights=True
    )
]

model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=callbacks
)

# ---------------- SAVE ----------------

model.save(os.path.join(MODEL_DIR, "stage2_hazard_classification.h5"))

print("✅ Stage-2 model training complete")
