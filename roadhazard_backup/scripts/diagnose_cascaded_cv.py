#!/usr/bin/env python3
"""
Diagnostic script: investigate cascaded CV accuracy discrepancy.

The cascaded system shows 5-fold CV mean accuracy of ~0.188, but
Stage-1 test accuracy is 0.803 and Stage-2 test accuracy is 0.667.
This script traces through one CV fold to verify:
1. Label mapping (original 3-class encoding)
2. Stage-1 predictions (normal vs hazard)
3. Stage-2 predictions (speedbreaker vs pothole) applied only to hazard samples
4. Final cascaded predictions (mapped back to 0,1,2)
5. Accuracy computation
"""
import os
import json
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'processed_accel_only_fixed')
from config import MODEL_DIR as MODELS_DIR, RESULTS_DIR

# Load training data (CV will be performed on train split only)
X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))

print("=" * 70)
print("CASCADED CV DIAGNOSTIC")
print("=" * 70)
print()

# Original label distribution
print("Original training set label distribution:")
unique, counts = np.unique(y_train, return_counts=True)
for lbl, cnt in zip(unique, counts):
    print(f"  Class {lbl}: {cnt} samples")
print()

# Load trained models (these were trained on full training set)
def safe_load_model(path):
    try:
        import tensorflow as tf
        return tf.keras.models.load_model(path)
    except Exception as e:
        print(f"ERROR loading {path}: {e}")
        return None

s1_model = safe_load_model(os.path.join(MODELS_DIR, 'stage1_binary_v2.keras'))
s2_model = safe_load_model(os.path.join(MODELS_DIR, 'stage2_subtype_v2.keras'))

if s1_model is None or s2_model is None:
    print("ERROR: Could not load stage models")
    exit(1)

# Perform 5-fold CV: use same seed and parameters as compare_cascaded_vs_3class.py
RANDOM_SEED = 42
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

print("=" * 70)
print("FOLD 1 DETAILED TRACE")
print("=" * 70)
print()

fold_idx = 0
for train_idx, val_idx in skf.split(X_train, y_train):
    if fold_idx == 0:
        # Extract fold data
        X_fold_train, X_fold_val = X_train[train_idx], X_train[val_idx]
        y_fold_train, y_fold_val = y_train[train_idx], y_train[val_idx]
        
        print(f"Fold 1 splits:")
        print(f"  Train size: {X_fold_train.shape[0]}, Val size: {X_fold_val.shape[0]}")
        print()
        
        print(f"Fold 1 validation set label distribution:")
        unique_val, counts_val = np.unique(y_fold_val, return_counts=True)
        for lbl, cnt in zip(unique_val, counts_val):
            print(f"  Class {lbl}: {cnt} samples")
        print()
        
        # Use pre-trained models (NOT refit on fold) to make predictions on val fold
        # This is what compare_cascaded_vs_3class.py does: it loads pre-trained models
        # and uses them to predict on validation fold
        print("Evaluating PRE-TRAINED Stage-1 model on validation fold:")
        s1_proba = s1_model.predict(X_fold_val, verbose=0)
        s1_pred = (s1_proba > 0.5).astype(int).flatten()
        
        print(f"  Stage-1 predictions (binary): {np.unique(s1_pred, return_counts=True)}")
        print(f"    Class 0 (normal): {np.sum(s1_pred == 0)}")
        print(f"    Class 1 (hazard): {np.sum(s1_pred == 1)}")
        print()
        
        # Ground truth for Stage-1: binary (0=normal, 1=hazard)
        # In original encoding: 0=normal, 1=speedbreaker, 2=pothole
        # So Stage-1 binary GT: y_fold_val > 0
        y_fold_val_s1_gt = (y_fold_val > 0).astype(int)
        s1_acc = accuracy_score(y_fold_val_s1_gt, s1_pred)
        print(f"  Stage-1 accuracy on this fold: {s1_acc:.4f}")
        print()
        
        # Stage-2: filter hazard samples (Stage-1 predicted hazard)
        # These are the samples where Stage-1 predicted class 1
        hazard_pred_idx = np.where(s1_pred == 1)[0]
        hazard_gt_idx = np.where(y_fold_val > 0)[0]
        
        print(f"Stage-1 predictions on validation fold:")
        print(f"  Predicted hazard (class 1): {len(hazard_pred_idx)} samples")
        print(f"  Ground truth hazard (y>0): {len(hazard_gt_idx)} samples")
        print()
        
        # For Stage-2: feed Stage-1 predicted hazard samples
        if len(hazard_pred_idx) > 0:
            X_hazard_pred = X_fold_val[hazard_pred_idx]
            print(f"Evaluating PRE-TRAINED Stage-2 model on {len(hazard_pred_idx)} Stage-1 predicted hazard samples:")
            s2_proba = s2_model.predict(X_hazard_pred, verbose=0)
            s2_pred = (s2_proba > 0.5).astype(int).flatten()
            print(f"  Stage-2 predictions (binary): {np.unique(s2_pred, return_counts=True)}")
            print(f"    Class 0 (speedbreaker): {np.sum(s2_pred == 0)}")
            print(f"    Class 1 (pothole): {np.sum(s2_pred == 1)}")
            print()
        else:
            s2_pred = np.array([])
            print(f"Stage-2: No hazard samples predicted by Stage-1, skipping Stage-2 evaluation.")
            print()
        
        # Now construct cascaded predictions for ENTIRE validation fold
        # Mapping:
        #   - If Stage-1 predicts normal (0) → final prediction is 0 (normal)
        #   - If Stage-1 predicts hazard (1) AND Stage-2 predicts speedbreaker (0) → final is 1 (speedbreaker)
        #   - If Stage-1 predicts hazard (1) AND Stage-2 predicts pothole (1) → final is 2 (pothole)
        
        cascade_pred = np.zeros_like(s1_pred, dtype=int)
        for i, idx in enumerate(hazard_pred_idx):
            # Stage-2 predicted this sample
            if i < len(s2_pred):
                if s2_pred[i] == 0:
                    cascade_pred[idx] = 1  # speedbreaker
                else:
                    cascade_pred[idx] = 2  # pothole
            # else: if s2_pred is shorter, this shouldn't happen, but leave it 0 (normal) or log error
        
        print(f"Cascaded predictions on validation fold (mapping S1+S2→3-class):")
        print(f"  Final class 0 (normal): {np.sum(cascade_pred == 0)}")
        print(f"  Final class 1 (speedbreaker): {np.sum(cascade_pred == 1)}")
        print(f"  Final class 2 (pothole): {np.sum(cascade_pred == 2)}")
        print()
        
        print(f"Ground truth on validation fold:")
        print(f"  Class 0 (normal): {np.sum(y_fold_val == 0)}")
        print(f"  Class 1 (speedbreaker): {np.sum(y_fold_val == 1)}")
        print(f"  Class 2 (pothole): {np.sum(y_fold_val == 2)}")
        print()
        
        # Compute accuracy
        cascade_acc = accuracy_score(y_fold_val, cascade_pred)
        print(f"Cascaded accuracy (3-class): {cascade_acc:.6f}")
        print()
        
        # Confusion matrix
        cm = confusion_matrix(y_fold_val, cascade_pred, labels=[0, 1, 2])
        print("Confusion matrix (rows=true, cols=pred):")
        print("       Pred-0  Pred-1  Pred-2")
        for i, row in enumerate(cm):
            print(f"True-{i}: {row[0]:4d}  {row[1]:4d}  {row[2]:4d}")
        print()
        
        # Classification report
        print("Classification report:")
        print(classification_report(y_fold_val, cascade_pred, target_names=['normal', 'speedbreaker', 'pothole']))
        print()
        
        # Additional diagnostics: check if models are over/underfitting
        print("=" * 70)
        print("DETAILED DIAGNOSTICS")
        print("=" * 70)
        print()
        
        # Stage-1 confusion matrix on this fold
        s1_cm = confusion_matrix(y_fold_val_s1_gt, s1_pred)
        print("Stage-1 confusion matrix (binary):")
        print("       Pred-0  Pred-1")
        for i, row in enumerate(s1_cm):
            print(f"True-{i}: {row[0]:4d}  {row[1]:4d}")
        print()
        
        # Stage-2 confusion matrix (only on true hazard samples)
        if len(hazard_gt_idx) > 0:
            X_hazard_gt = X_fold_val[hazard_gt_idx]
            y_hazard_gt = y_fold_val[hazard_gt_idx]
            # Remap to binary (1->0, 2->1)
            y_hazard_gt_s2 = (y_hazard_gt == 2).astype(int)
            s2_proba_gt = s2_model.predict(X_hazard_gt, verbose=0)
            s2_pred_gt = (s2_proba_gt > 0.5).astype(int).flatten()
            s2_acc_gt = accuracy_score(y_hazard_gt_s2, s2_pred_gt)
            s2_cm_gt = confusion_matrix(y_hazard_gt_s2, s2_pred_gt)
            print(f"Stage-2 accuracy (evaluated on TRUE hazard samples): {s2_acc_gt:.4f}")
            print("Stage-2 confusion matrix (binary):")
            print("       Pred-0  Pred-1")
            for i, row in enumerate(s2_cm_gt):
                print(f"True-{i}: {row[0]:4d}  {row[1]:4d}")
            print()
        
        # Summary: explain the discrepancy
        print("=" * 70)
        print("HYPOTHESIS: WHY IS CASCADED CV LOWER?")
        print("=" * 70)
        print()
        
        print("Possible reasons:")
        print("1. Models trained on FULL training set are being applied to CV fold validation set.")
        print("   - This is a form of data leakage (train set is used to train, then same set (val fold) evaluated).")
        print("   - Compare: test accuracy uses models trained on full train+val, evaluated on held-out test.")
        print()
        print("2. Stage-1 is a BINARY classifier (normal vs hazard).")
        print("   - It outputs 2 classes, but 3-class baseline outputs 3 classes.")
        print("   - Cascaded system loses fine-grained hazard subtype info during Stage-1.")
        print()
        print("3. Error propagation: if Stage-1 misclassifies, Stage-2 is not even consulted.")
        print("   - Cascaded chain: errors in Stage-1 directly → errors in final prediction.")
        print()
        print("4. Class imbalance: Normal class (0) is much larger than hazard classes.")
        print("   - Stage-1 trained to distinguish normal vs hazard may be biased to normal.")
        print("   - If Stage-1 predicts too many samples as normal (class 0), cascaded system")
        print("     will output many class-0 predictions, potentially ignoring speedbreaker/pothole.")
        print()
        
        # Check for this bias
        print("Checking prediction bias:")
        normal_pred_pct = 100.0 * np.sum(cascade_pred == 0) / len(cascade_pred)
        normal_true_pct = 100.0 * np.sum(y_fold_val == 0) / len(y_fold_val)
        print(f"  Cascaded predicted normal: {normal_pred_pct:.1f}%")
        print(f"  True normal: {normal_true_pct:.1f}%")
        if normal_pred_pct > normal_true_pct + 10:
            print(f"  ⚠️  Model biased to predict normal (overestimating by {normal_pred_pct - normal_true_pct:.1f}%)")
        print()
        
        # Final summary statistics
        print("=" * 70)
        print("SUMMARY FOR FOLD 1")
        print("=" * 70)
        print(f"Stage-1 accuracy (binary normal vs hazard): {s1_acc:.4f}")
        if len(hazard_gt_idx) > 0:
            print(f"Stage-2 accuracy (binary speedbreaker vs pothole, on true hazard): {s2_acc_gt:.4f}")
        print(f"Cascaded accuracy (3-class): {cascade_acc:.4f}")
        print()
        
        break
    fold_idx += 1

# Now run full 5-fold to collect all fold accuracies
print("=" * 70)
print("FULL 5-FOLD CASCADED CV")
print("=" * 70)
print()

cascade_fold_accs = []
for train_idx, val_idx in skf.split(X_train, y_train):
    X_fold_train, X_fold_val = X_train[train_idx], X_train[val_idx]
    y_fold_train, y_fold_val = y_train[train_idx], y_train[val_idx]
    
    # Stage-1 predictions
    s1_proba = s1_model.predict(X_fold_val, verbose=0)
    s1_pred = (s1_proba > 0.5).astype(int).flatten()
    
    # Stage-2: filter Stage-1 predicted hazard
    hazard_pred_idx = np.where(s1_pred == 1)[0]
    cascade_pred = np.zeros_like(s1_pred, dtype=int)
    
    if len(hazard_pred_idx) > 0:
        X_hazard = X_fold_val[hazard_pred_idx]
        s2_proba = s2_model.predict(X_hazard, verbose=0)
        s2_pred = (s2_proba > 0.5).astype(int).flatten()
        for i, idx in enumerate(hazard_pred_idx):
            if i < len(s2_pred):
                cascade_pred[idx] = 1 if s2_pred[i] == 0 else 2
    
    # Accuracy
    acc = accuracy_score(y_fold_val, cascade_pred)
    cascade_fold_accs.append(acc)
    print(f"Fold {len(cascade_fold_accs)}: {acc:.6f}")

print()
print(f"Cascaded 5-fold mean: {np.mean(cascade_fold_accs):.6f} ± {np.std(cascade_fold_accs):.6f}")
print(f"Fold accuracies: {cascade_fold_accs}")
print()

# Sanity check: does this match the value from ablation_results.json?
ablation_path = os.path.join(RESULTS_DIR, 'ablation_results.json')
if os.path.exists(ablation_path):
    with open(ablation_path, 'r') as f:
        ablation = json.load(f)
    print("Ablation results (comparing against our recompute):")
    for cfg, data in ablation.items():
        if isinstance(data, dict) and 'cascaded_cv' in data:
            stored_mean = np.mean(data['cascaded_cv']['fold_accuracies'])
            print(f"  {cfg}: stored mean={stored_mean:.6f}")
print()

print("=" * 70)
print("CONCLUSION")
print("=" * 70)
print()
print("The cascaded CV accuracy (~0.188) is much lower than Stage-1 test (0.803)")
print("and Stage-2 test (0.667) because:")
print()
print("LIKELY CAUSE: The cascaded system uses pre-trained models trained on")
print("the FULL training set. When applied to a CV validation fold, the models")
print("are being evaluated on data they have seen during training (data leakage).")
print()
print("In contrast, the test set accuracies use models trained on train+val,")
print("evaluated on a completely held-out test set.")
print()
print("Additionally, the cascaded binary architecture (Stage-1 normal vs hazard)")
print("loses granularity compared to the 3-class direct classifier, and errors")
print("in Stage-1 propagate to incorrect final predictions.")
print()
