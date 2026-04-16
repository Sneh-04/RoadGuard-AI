import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv1D, MaxPooling1D,
    GlobalAveragePooling1D,
    Dense, Dropout, BatchNormalization
)
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# -------------------------
# Paths
# -------------------------
from config import MODEL_DIR
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed_accel_only_fixed")

os.makedirs(MODEL_DIR, exist_ok=True)

# -------------------------
# Load data
# -------------------------
X_train = np.load(os.path.join(DATA_DIR, "X_train.npy"))
y_train = np.load(os.path.join(DATA_DIR, "y_train.npy"))

X_val = np.load(os.path.join(DATA_DIR, "X_val.npy"))
y_val = np.load(os.path.join(DATA_DIR, "y_val.npy"))

print("X_train shape:", X_train.shape)  # (N, 100, 3)
print("y_train shape:", y_train.shape)

# -------------------------
# Stage 1 labels
# 0 = Normal
# 1 = Hazard (1 or 2)
# -------------------------
y_train_bin = (y_train > 0).astype(np.int32)
y_val_bin = (y_val > 0).astype(np.int32)

# -------------------------
# Model
# -------------------------
model = Sequential([
    Conv1D(32, kernel_size=5, activation="relu", input_shape=(100, 3)),
    BatchNormalization(),
    MaxPooling1D(2),

    Conv1D(64, kernel_size=3, activation="relu"),
    BatchNormalization(),
    MaxPooling1D(2),

    Conv1D(128, kernel_size=3, activation="relu"),
    BatchNormalization(),

    GlobalAveragePooling1D(),

    Dense(64, activation="relu"),
    Dropout(0.3),

    Dense(1, activation="sigmoid")  # Binary output
])

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# -------------------------
# Callbacks
# -------------------------
callbacks = [
    EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True
    ),
    ModelCheckpoint(
        filepath=os.path.join(MODEL_DIR, "stage1_binary_best.h5"),
        monitor="val_loss",
        save_best_only=True
    )
]

# -------------------------
# Train
# -------------------------
history = model.fit(
    X_train, y_train_bin,
    validation_data=(X_val, y_val_bin),
    epochs=50,
    batch_size=32,
    callbacks=callbacks
)

# -------------------------
# Save final model
# -------------------------
# If you have the original model object after training save into centralized model dir
model.save(os.path.join(MODEL_DIR, "stage1_normal_vs_hazard.h5"))



print("✅ Stage 1 model training complete")
