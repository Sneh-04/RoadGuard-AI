#!/usr/bin/env python3
"""
EVALUATE MODELS: Comprehensive test set evaluation for both stages.

This script:
- Loads trained models in .keras format
- Runs inference on test set
- Computes detailed metrics
- Generates confusion matrices and reports
"""

import os
import json
import numpy as np
import tensorflow as tf
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

print(f"Results directory: {RESULTS_DIR}")
print()

# ====== LOAD DATA ======
print("Loading test data...")
X_test = np.load(os.path.join(DATA_DIR, "X_test.npy"))
y_test = np.load(os.path.join(DATA_DIR, "y_test.npy"))
print(f"X_test shape: {X_test.shape}")
print(f"y_test shape: {y_test.shape}")
print()

# ====== STAGE 1 EVALUATION ======
print("=" * 70)
print("STAGE 1: BINARY CLASSIFICATION (Normal vs Hazard)")
print("=" * 70)
print()

# Load Stage-1 model
stage1_model_path = os.path.join(MODEL_DIR, "stage1_binary_v2.keras")
try:
    stage1_model = tf.keras.models.load_model(stage1_model_path, compile=False)
    print(f"✅ Loaded Stage-1 model from {stage1_model_path}")
except Exception as e:
    print(f"❌ Failed to load Stage-1 model: {e}")
    stage1_model = None

if stage1_model:
    # Create binary labels for test set
    y_test_bin = (y_test > 0).astype(np.int32)
    
    # Compile model for evaluation
    stage1_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    
    # Inference
    y_pred_proba_s1 = stage1_model.predict(X_test, verbose=0)
    y_pred_s1 = (y_pred_proba_s1 > 0.5).astype(int).flatten()
    
    # Metrics
    loss_s1, acc_s1 = stage1_model.evaluate(X_test, y_test_bin, verbose=0)
    precision_s1 = precision_score(y_test_bin, y_pred_s1, zero_division=0)
    recall_s1 = recall_score(y_test_bin, y_pred_s1, zero_division=0)
    f1_s1 = f1_score(y_test_bin, y_pred_s1, zero_division=0)
    roc_auc_s1 = roc_auc_score(y_test_bin, y_pred_proba_s1)
    cm_s1 = confusion_matrix(y_test_bin, y_pred_s1)
    
    print(f"Test Loss:   {loss_s1:.4f}")
    print(f"Accuracy:    {acc_s1:.4f}")
    print(f"Precision:   {precision_s1:.4f}")
    print(f"Recall:      {recall_s1:.4f}")
    print(f"F1-Score:    {f1_s1:.4f}")
    print(f"ROC-AUC:     {roc_auc_s1:.4f}")
    print()
    
    print("Classification Report:")
    print(classification_report(y_test_bin, y_pred_s1, target_names=["Normal", "Hazard"]))
    print()
    
    print("Confusion Matrix:")
    print(cm_s1)
    print()
    
    # Save confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm_s1, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Normal', 'Hazard'],
                yticklabels=['Normal', 'Hazard'],
                cbar_kws={'label': 'Count'})
    plt.title('Stage-1: Confusion Matrix (Test Set)')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    cm_path = os.path.join(RESULTS_DIR, "stage1_cm_test.png")
    plt.savefig(cm_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✅ Confusion matrix saved: {cm_path}")
    print()
    
    # Save results
    stage1_eval = {
        "model": "stage1_binary_v2.keras",
        "test_loss": float(loss_s1),
        "test_accuracy": float(acc_s1),
        "precision": float(precision_s1),
        "recall": float(recall_s1),
        "f1_score": float(f1_s1),
        "roc_auc": float(roc_auc_s1),
        "confusion_matrix": cm_s1.tolist(),
        "dataset_split": {
            "total_test_samples": int(len(y_test)),
            "normal_count": int((y_test_bin == 0).sum()),
            "hazard_count": int((y_test_bin == 1).sum())
        }
    }
    
    with open(os.path.join(RESULTS_DIR, "stage1_evaluation.json"), 'w') as f:
        json.dump(stage1_eval, f, indent=2)
    print(f"✅ Evaluation results saved: stage1_evaluation.json")
    print()

# ====== STAGE 2 EVALUATION ======
print("=" * 70)
print("STAGE 2: HAZARD SUBTYPE (Speedbreaker vs Pothole)")
print("=" * 70)
print()

# Load Stage-2 model
stage2_model_path = os.path.join(MODEL_DIR, "stage2_subtype_v2.keras")
try:
    stage2_model = tf.keras.models.load_model(stage2_model_path, compile=False)
    print(f"✅ Loaded Stage-2 model from {stage2_model_path}")
except Exception as e:
    print(f"❌ Failed to load Stage-2 model: {e}")
    stage2_model = None

if stage2_model:
    # Filter test set to hazards only
    hazard_mask = np.isin(y_test, [1, 2])
    X_test_hazard = X_test[hazard_mask]
    y_test_hazard = y_test[hazard_mask]
    
    # Remap labels
    y_test_bin_s2 = (y_test_hazard == 2).astype(np.int32)
    
    # Compile model for evaluation
    stage2_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    
    print(f"Test hazards: {len(y_test_hazard)}")
    print(f"Speedbreaker: {(y_test_bin_s2 == 0).sum()}")
    print(f"Pothole:      {(y_test_bin_s2 == 1).sum()}")
    print()
    
    # Inference
    y_pred_proba_s2 = stage2_model.predict(X_test_hazard, verbose=0)
    y_pred_s2 = (y_pred_proba_s2 > 0.5).astype(int).flatten()
    
    # Metrics
    loss_s2, acc_s2 = stage2_model.evaluate(X_test_hazard, y_test_bin_s2, verbose=0)
    precision_s2 = precision_score(y_test_bin_s2, y_pred_s2, zero_division=0)
    recall_s2 = recall_score(y_test_bin_s2, y_pred_s2, zero_division=0)
    f1_s2 = f1_score(y_test_bin_s2, y_pred_s2, zero_division=0)
    roc_auc_s2 = roc_auc_score(y_test_bin_s2, y_pred_proba_s2)
    cm_s2 = confusion_matrix(y_test_bin_s2, y_pred_s2)
    
    print(f"Test Loss:   {loss_s2:.4f}")
    print(f"Accuracy:    {acc_s2:.4f}")
    print(f"Precision:   {precision_s2:.4f}")
    print(f"Recall:      {recall_s2:.4f}")
    print(f"F1-Score:    {f1_s2:.4f}")
    print(f"ROC-AUC:     {roc_auc_s2:.4f}")
    print()
    
    print("Classification Report:")
    print(classification_report(y_test_bin_s2, y_pred_s2, target_names=["Speedbreaker", "Pothole"]))
    print()
    
    print("Confusion Matrix:")
    print(cm_s2)
    print()
    
    # Save confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm_s2, annot=True, fmt='d', cmap='Greens',
                xticklabels=['Speedbreaker', 'Pothole'],
                yticklabels=['Speedbreaker', 'Pothole'],
                cbar_kws={'label': 'Count'})
    plt.title('Stage-2: Confusion Matrix (Test Set)')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    cm_path = os.path.join(RESULTS_DIR, "stage2_cm_test.png")
    plt.savefig(cm_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✅ Confusion matrix saved: {cm_path}")
    print()
    
    # Save results
    stage2_eval = {
        "model": "stage2_subtype_v2.keras",
        "test_loss": float(loss_s2),
        "test_accuracy": float(acc_s2),
        "precision": float(precision_s2),
        "recall": float(recall_s2),
        "f1_score": float(f1_s2),
        "roc_auc": float(roc_auc_s2),
        "confusion_matrix": cm_s2.tolist(),
        "dataset_split": {
            "total_test_hazards": int(len(y_test_hazard)),
            "speedbreaker_count": int((y_test_bin_s2 == 0).sum()),
            "pothole_count": int((y_test_bin_s2 == 1).sum())
        }
    }
    
    with open(os.path.join(RESULTS_DIR, "stage2_evaluation.json"), 'w') as f:
        json.dump(stage2_eval, f, indent=2)
    print(f"✅ Evaluation results saved: stage2_evaluation.json")
    print()

# ====== SUMMARY ======
print("=" * 70)
print("EVALUATION COMPLETE")
print("=" * 70)
print()
print("Results saved to:")
print(f"  - {RESULTS_DIR}/stage1_evaluation.json")
print(f"  - {RESULTS_DIR}/stage2_evaluation.json")
print(f"  - {RESULTS_DIR}/stage1_cm_test.png")
print(f"  - {RESULTS_DIR}/stage2_cm_test.png")
