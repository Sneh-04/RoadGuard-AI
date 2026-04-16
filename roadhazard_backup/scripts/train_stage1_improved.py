#!/usr/bin/env python3
"""
STAGE 1: BINARY CLASSIFICATION (Normal vs Hazard)
Research-grade training script with reproducibility, class balancing, and logging.

Modified: Feb 28, 2026
Improvements:
- Deterministic random seeding
- Class weight balancing
- CSV logging and TensorBoard
- Cross-validation (K-Fold)
- Comprehensive metrics computation
- Results saved as JSON
"""

import os
import sys
import json
import random
import numpy as np
import tensorflow as tf
from datetime import datetime

# ====== REPRODUCIBILITY ======
RANDOM_SEED = 42

def set_random_seeds(seed=RANDOM_SEED):
    """Set all random seeds for reproducibility."""
    os.environ['PYTHONHASHSEED'] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    print(f"✅ Random seeds set to {seed}")

set_random_seeds(RANDOM_SEED)

# Log versions
print(f"Python: {sys.version}")
print(f"NumPy: {np.__version__}")
print(f"TensorFlow: {tf.__version__}")
print()

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv1D, MaxPooling1D, GlobalAveragePooling1D,
    Dense, Dropout, BatchNormalization
)
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, CSVLogger, TensorBoard
from sklearn.utils.class_weight import compute_class_weight
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns

# ====== PATHS ======
from config import MODEL_DIR, RESULTS_DIR
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed_accel_only_fixed")
LOGS_DIR = os.path.join(BASE_DIR, "logs", "stage1")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

print(f"Data directory: {DATA_DIR}")
print(f"Model directory: {MODEL_DIR}")
print(f"Results directory: {RESULTS_DIR}")
print(f"Logs directory: {LOGS_DIR}")
print()

# ====== LOAD DATA ======
print("Loading data...")
X_train = np.load(os.path.join(DATA_DIR, "X_train.npy"))
y_train = np.load(os.path.join(DATA_DIR, "y_train.npy"))
X_val = np.load(os.path.join(DATA_DIR, "X_val.npy"))
y_val = np.load(os.path.join(DATA_DIR, "y_val.npy"))
X_test = np.load(os.path.join(DATA_DIR, "X_test.npy"))
y_test = np.load(os.path.join(DATA_DIR, "y_test.npy"))

print(f"X_train shape: {X_train.shape}")
print(f"y_train shape: {y_train.shape}")
print(f"X_val shape: {X_val.shape}")
print(f"y_val shape: {y_val.shape}")
print(f"X_test shape: {X_test.shape}")
print(f"y_test shape: {y_test.shape}")
print()

# ====== CREATE BINARY LABELS ======
print("Creating binary labels (0=Normal, 1=Hazard)...")
y_train_bin = (y_train > 0).astype(np.int32)
y_val_bin = (y_val > 0).astype(np.int32)
y_test_bin = (y_test > 0).astype(np.int32)

train_dist = np.bincount(y_train_bin)
val_dist = np.bincount(y_val_bin)
test_dist = np.bincount(y_test_bin)

print(f"Train distribution: Class 0: {train_dist[0]}, Class 1: {train_dist[1]}")
print(f"Val distribution:   Class 0: {val_dist[0]}, Class 1: {val_dist[1]}")
print(f"Test distribution:  Class 0: {test_dist[0]}, Class 1: {test_dist[1]}")
print()

# ====== COMPUTE CLASS WEIGHTS ======
print("Computing class weights...")
class_weights = compute_class_weight(
    'balanced',
    classes=np.unique(y_train_bin),
    y=y_train_bin
)
class_weight_dict = {i: w for i, w in enumerate(class_weights)}
print(f"Class weights: {class_weight_dict}")
print()

# ====== BUILD MODEL ======
print("Building Stage-1 CNN model...")
model = Sequential([
    Conv1D(32, kernel_size=5, activation="relu", input_shape=(100, 3), name="conv1d_1"),
    BatchNormalization(name="batch_norm_1"),
    MaxPooling1D(2, name="maxpool_1"),

    Conv1D(64, kernel_size=3, activation="relu", name="conv1d_2"),
    BatchNormalization(name="batch_norm_2"),
    MaxPooling1D(2, name="maxpool_2"),

    Conv1D(128, kernel_size=3, activation="relu", name="conv1d_3"),
    BatchNormalization(name="batch_norm_3"),

    GlobalAveragePooling1D(name="global_avg_pool"),

    Dense(64, activation="relu", name="dense_1"),
    Dropout(0.3, name="dropout_1"),

    Dense(1, activation="sigmoid", name="output")
])

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

print(model.summary())
print()

# ====== SETUP CALLBACKS ======
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
csv_log_path = os.path.join(LOGS_DIR, f"training_{timestamp}.csv")
tb_log_dir = os.path.join(LOGS_DIR, f"tensorboard_{timestamp}")

callbacks = [
    EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True,
        verbose=1
    ),
    ModelCheckpoint(
        filepath=os.path.join(MODEL_DIR, "stage1_binary_v2_checkpoint.keras"),
        monitor="val_loss",
        save_best_only=True,
        verbose=1
    ),
    CSVLogger(csv_log_path, append=False),
    TensorBoard(log_dir=tb_log_dir, histogram_freq=1)
]

# ====== TRAIN MODEL ======
print("Training Stage-1 model...")
history = model.fit(
    X_train, y_train_bin,
    validation_data=(X_val, y_val_bin),
    epochs=50,
    batch_size=32,
    class_weight=class_weight_dict,
    callbacks=callbacks,
    verbose=1
)

print("✅ Training complete!")
print()

# ====== SAVE FINAL MODEL ======
final_model_path = os.path.join(MODEL_DIR, "stage1_binary_v2.keras")
model.save(final_model_path)
print(f"✅ Model saved to {final_model_path}")
print()

# ====== EVALUATE ON TEST SET ======
print("Evaluating on test set...")
test_loss, test_acc = model.evaluate(X_test, y_test_bin, verbose=0)
print(f"Test Loss: {test_loss:.4f}, Test Accuracy: {test_acc:.4f}")
print()

# ====== COMPUTE METRICS ======
print("Computing classification metrics...")
y_pred_proba = model.predict(X_test, verbose=0)
y_pred = (y_pred_proba > 0.5).astype(int).flatten()

accuracy = accuracy_score(y_test_bin, y_pred)
precision = precision_score(y_test_bin, y_pred, zero_division=0)
recall = recall_score(y_test_bin, y_pred, zero_division=0)
f1 = f1_score(y_test_bin, y_pred, zero_division=0)
roc_auc = roc_auc_score(y_test_bin, y_pred_proba)
cm = confusion_matrix(y_test_bin, y_pred)

print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1-Score:  {f1:.4f}")
print(f"ROC-AUC:   {roc_auc:.4f}")
print()

print("Classification Report:")
print(classification_report(y_test_bin, y_pred, target_names=["Normal", "Hazard"]))
print()

print("Confusion Matrix:")
print(cm)
print()

# ====== SAVE CONFUSION MATRIX ======
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Normal', 'Hazard'],
            yticklabels=['Normal', 'Hazard'])
plt.title('Stage-1: Confusion Matrix (Test Set)')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
cm_path = os.path.join(RESULTS_DIR, "stage1_confusion_matrix.png")
plt.savefig(cm_path, dpi=300, bbox_inches='tight')
plt.close()
print(f"✅ Confusion matrix saved to {cm_path}")
print()

# ====== SAVE TRAINING HISTORY ======
history_dict = {
    'loss': history.history['loss'],
    'val_loss': history.history['val_loss'],
    'accuracy': history.history['accuracy'],
    'val_accuracy': history.history['val_accuracy'],
    'epochs': len(history.history['loss'])
}
history_path = os.path.join(RESULTS_DIR, "stage1_history.json")
with open(history_path, 'w') as f:
    json.dump(history_dict, f, indent=2)
print(f"✅ Training history saved to {history_path}")
print()

# ====== SAVE METRICS ======
metrics = {
    "test_loss": float(test_loss),
    "test_accuracy": float(test_acc),
    "accuracy": float(accuracy),
    "precision": float(precision),
    "recall": float(recall),
    "f1_score": float(f1),
    "roc_auc": float(roc_auc),
    "confusion_matrix": cm.tolist(),
    "class_distribution": {
        "train": {"class_0": int(train_dist[0]), "class_1": int(train_dist[1])},
        "val": {"class_0": int(val_dist[0]), "class_1": int(val_dist[1])},
        "test": {"class_0": int(test_dist[0]), "class_1": int(test_dist[1])}
    },
    "class_weights": class_weight_dict,
    "hyperparameters": {
        "epochs": 50,
        "batch_size": 32,
        "optimizer": "adam",
        "loss": "binary_crossentropy",
        "dropout": 0.3
    }
}

metrics_path = os.path.join(RESULTS_DIR, "stage1_metrics.json")
with open(metrics_path, 'w') as f:
    json.dump(metrics, f, indent=2)
print(f"✅ Metrics saved to {metrics_path}")
print()

# ====== PLOT TRAINING CURVES ======
fig, axes = plt.subplots(1, 2, figsize=(15, 5))

axes[0].plot(history.history['loss'], label='Train Loss', linewidth=2)
axes[0].plot(history.history['val_loss'], label='Val Loss', linewidth=2)
axes[0].set_xlabel('Epoch')
axes[0].set_ylabel('Loss')
axes[0].set_title('Stage-1: Training and Validation Loss')
axes[0].legend()
axes[0].grid(True, alpha=0.3)

axes[1].plot(history.history['accuracy'], label='Train Accuracy', linewidth=2)
axes[1].plot(history.history['val_accuracy'], label='Val Accuracy', linewidth=2)
axes[1].set_xlabel('Epoch')
axes[1].set_ylabel('Accuracy')
axes[1].set_title('Stage-1: Training and Validation Accuracy')
axes[1].legend()
axes[1].grid(True, alpha=0.3)

curves_path = os.path.join(RESULTS_DIR, "stage1_training_curves.png")
plt.savefig(curves_path, dpi=300, bbox_inches='tight')
plt.close()
print(f"✅ Training curves saved to {curves_path}")
print()

# ====== K-FOLD CROSS-VALIDATION ======
print("=" * 60)
print("STRATIFIED K-FOLD CROSS-VALIDATION (k=5)")
print("=" * 60)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
cv_results = {
    "fold_accuracies": [],
    "fold_precisions": [],
    "fold_recalls": [],
    "fold_f1_scores": [],
    "fold_roc_aucs": []
}

fold_num = 1
for train_idx, val_idx in skf.split(X_train, y_train_bin):
    print(f"\nFold {fold_num}/5")
    
    X_fold_train, X_fold_val = X_train[train_idx], X_train[val_idx]
    y_fold_train, y_fold_val = y_train_bin[train_idx], y_train_bin[val_idx]
    
    # Build fresh model for this fold
    fold_model = Sequential([
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
        Dense(1, activation="sigmoid")
    ])
    
    fold_model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
    
    fold_model.fit(
        X_fold_train, y_fold_train,
        validation_data=(X_fold_val, y_fold_val),
        epochs=50,
        batch_size=32,
        class_weight=class_weight_dict,
        callbacks=[EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True)],
        verbose=0
    )
    
    # Evaluate fold
    y_fold_pred_proba = fold_model.predict(X_fold_val, verbose=0)
    y_fold_pred = (y_fold_pred_proba > 0.5).astype(int).flatten()
    
    fold_acc = accuracy_score(y_fold_val, y_fold_pred)
    fold_prec = precision_score(y_fold_val, y_fold_pred, zero_division=0)
    fold_rec = recall_score(y_fold_val, y_fold_pred, zero_division=0)
    fold_f1 = f1_score(y_fold_val, y_fold_pred, zero_division=0)
    fold_roc_auc = roc_auc_score(y_fold_val, y_fold_pred_proba)
    
    cv_results["fold_accuracies"].append(float(fold_acc))
    cv_results["fold_precisions"].append(float(fold_prec))
    cv_results["fold_recalls"].append(float(fold_rec))
    cv_results["fold_f1_scores"].append(float(fold_f1))
    cv_results["fold_roc_aucs"].append(float(fold_roc_auc))
    
    print(f"  Accuracy: {fold_acc:.4f}, Precision: {fold_prec:.4f}, Recall: {fold_rec:.4f}, F1: {fold_f1:.4f}, ROC-AUC: {fold_roc_auc:.4f}")
    
    fold_num += 1

# Compute statistics
cv_results["mean_accuracy"] = float(np.mean(cv_results["fold_accuracies"]))
cv_results["std_accuracy"] = float(np.std(cv_results["fold_accuracies"]))
cv_results["mean_precision"] = float(np.mean(cv_results["fold_precisions"]))
cv_results["mean_recall"] = float(np.mean(cv_results["fold_recalls"]))
cv_results["mean_f1_score"] = float(np.mean(cv_results["fold_f1_scores"]))
cv_results["mean_roc_auc"] = float(np.mean(cv_results["fold_roc_aucs"]))

print()
print(f"Mean Accuracy: {cv_results['mean_accuracy']:.4f} ± {cv_results['std_accuracy']:.4f}")
print(f"Mean Precision: {cv_results['mean_precision']:.4f}")
print(f"Mean Recall: {cv_results['mean_recall']:.4f}")
print(f"Mean F1-Score: {cv_results['mean_f1_score']:.4f}")
print(f"Mean ROC-AUC: {cv_results['mean_roc_auc']:.4f}")
print()

cv_path = os.path.join(RESULTS_DIR, "stage1_cv_results.json")
with open(cv_path, 'w') as f:
    json.dump(cv_results, f, indent=2)
print(f"✅ Cross-validation results saved to {cv_path}")
print()

print("=" * 60)
print("STAGE-1 TRAINING COMPLETE")
print("=" * 60)
