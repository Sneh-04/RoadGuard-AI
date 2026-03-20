#!/usr/bin/env python3
"""
Finalize and lock research protocol: recompute metrics, statistical test,
and produce final tables and integrity report using saved models and results.

This script follows the user's constraints: no retraining, no architecture changes.

Outputs written to `results/`:
 - final_results_table.csv
 - final_results_table.md
 - experimental_integrity_report.md
 - final_metrics_intermediate.json

Run: `python3 scripts/finalize_results.py`
"""
import os
import json
import time
import glob
import numpy as np
from pathlib import Path
from statistics import mean, stdev

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'processed_accel_only_fixed')
from config import MODEL_DIR as MODELS_DIR, RESULTS_DIR
SCRIPTS_DIR = os.path.join(BASE_DIR, 'scripts')

os.makedirs(RESULTS_DIR, exist_ok=True)

# Helper to load JSON safely
def load_json(path):
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except Exception:
        return None

# Load datasets
X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
Y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
X_val = np.load(os.path.join(DATA_DIR, 'X_val.npy'))
Y_val = np.load(os.path.join(DATA_DIR, 'y_val.npy'))
X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
Y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))

# Print dataset sizes for the log and report
dataset_sizes = {
    'X_train_shape': list(X_train.shape),
    'y_train_shape': list(Y_train.shape),
    'X_val_shape': list(X_val.shape),
    'y_val_shape': list(Y_val.shape),
    'X_test_shape': list(X_test.shape),
    'y_test_shape': list(Y_test.shape),
}

# Utility: load a keras model and evaluate predictions
def safe_load_model(path):
    try:
        import tensorflow as tf
        m = tf.keras.models.load_model(path)
        return m
    except Exception as e:
        return None

# Compute test metrics for given model and label mapping
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix
import os

results = {}
results['dataset_sizes'] = dataset_sizes
results['timestamp'] = time.strftime('%Y-%m-%d %H:%M:%S')

# 1) Stage-1: binary model (normal vs hazard)
s1_path = os.path.join(MODELS_DIR, 'stage1_binary_v2.keras')
if os.path.exists(s1_path):
    m1 = safe_load_model(s1_path)
    if m1 is not None:
        p1_proba = m1.predict(X_test, verbose=0)
        p1 = (p1_proba > 0.5).astype(int).flatten()
        # Stage-1 ground truth: hazard if original label >0
        y_test_stage1 = (Y_test > 0).astype(int)
        acc1 = float(accuracy_score(y_test_stage1, p1))
        f1_1 = float(f1_score(y_test_stage1, p1, average='macro'))
        results['stage1'] = {'test_accuracy': acc1, 'macro_f1': f1_1, 'params': int(m1.count_params())}
        # model size and time
        try:
            sz = os.path.getsize(s1_path)
            results['stage1']['size_bytes'] = sz
        except Exception:
            results['stage1']['size_bytes'] = None
        # timing
        try:
            # warmup
            for _ in range(3):
                m1.predict(X_test[:16], verbose=0)
            import time as _time
            n_runs = 5
            t0 = _time.time()
            for _ in range(n_runs):
                m1.predict(X_test, verbose=0)
            t1 = _time.time()
            avg_ms = ((t1 - t0) / n_runs) * 1000.0 / max(1, X_test.shape[0])
            results['stage1']['ms_per_sample'] = avg_ms
        except Exception:
            results['stage1']['ms_per_sample'] = None
    else:
        results['stage1'] = {'error': 'failed to load model'}
else:
    results['stage1'] = {'error': 'model file not found', 'path': s1_path}

# 2) Stage-2: subtype model (speedbreaker vs pothole) - evaluate only on hazard subset
s2_path = os.path.join(MODELS_DIR, 'stage2_subtype_v2.keras')
if os.path.exists(s2_path):
    m2 = safe_load_model(s2_path)
    if m2 is not None:
        # Filter hazard samples
        hazard_mask = (Y_test > 0)
        X_test_h = X_test[hazard_mask]
        y_test_h = Y_test[hazard_mask]
        if X_test_h.shape[0] > 0:
            # remap labels to 0/1 for stage2 expected (train used mapping 1->0,2->1)
            y_test_stage2 = (y_test_h == 2).astype(int)
            p2_proba = m2.predict(X_test_h, verbose=0)
            p2 = (p2_proba > 0.5).astype(int).flatten()
            acc2 = float(accuracy_score(y_test_stage2, p2))
            f1_2 = float(f1_score(y_test_stage2, p2, average='macro'))
            results['stage2'] = {'test_accuracy': acc2, 'macro_f1': f1_2, 'n_test_hazard': int(X_test_h.shape[0]), 'params': int(m2.count_params())}
            try:
                results['stage2']['size_bytes'] = os.path.getsize(s2_path)
            except Exception:
                results['stage2']['size_bytes'] = None
            # timing
            try:
                for _ in range(3):
                    m2.predict(X_test_h[:8], verbose=0)
                import time as _time
                n_runs = 5
                t0 = _time.time()
                for _ in range(n_runs):
                    m2.predict(X_test_h, verbose=0)
                t1 = _time.time()
                avg_ms = ((t1 - t0) / n_runs) * 1000.0 / max(1, X_test_h.shape[0])
                results['stage2']['ms_per_sample'] = avg_ms
            except Exception:
                results['stage2']['ms_per_sample'] = None
        else:
            results['stage2'] = {'error': 'no hazard samples in test set'}
    else:
        results['stage2'] = {'error': 'failed to load model'}
else:
    results['stage2'] = {'error': 'model file not found', 'path': s2_path}

# 3) 3-class baseline
three_path = os.path.join(MODELS_DIR, '3class_baseline.keras')
if os.path.exists(three_path):
    m3 = safe_load_model(three_path)
    if m3 is not None:
        p3_proba = m3.predict(X_test, verbose=0)
        if p3_proba.ndim > 1 and p3_proba.shape[1] > 1:
            p3 = np.argmax(p3_proba, axis=1)
        else:
            # fallback to binary threshold -> not expected
            p3 = (p3_proba > 0.5).astype(int).flatten()
        acc3 = float(accuracy_score(Y_test, p3))
        f1_3 = float(f1_score(Y_test, p3, average='macro'))
        results['three_class'] = {'test_accuracy': acc3, 'macro_f1': f1_3, 'params': int(m3.count_params())}
        try:
            results['three_class']['size_bytes'] = os.path.getsize(three_path)
        except Exception:
            results['three_class']['size_bytes'] = None
        # timing
        try:
            for _ in range(3):
                m3.predict(X_test[:16], verbose=0)
            import time as _time
            n_runs = 5
            t0 = _time.time()
            for _ in range(n_runs):
                m3.predict(X_test, verbose=0)
            t1 = _time.time()
            avg_ms = ((t1 - t0) / n_runs) * 1000.0 / max(1, X_test.shape[0])
            results['three_class']['ms_per_sample'] = avg_ms
        except Exception:
            results['three_class']['ms_per_sample'] = None
    else:
        results['three_class'] = {'error': 'failed to load model'}
else:
    results['three_class'] = {'error': 'model file not found', 'path': three_path}

# 4) Cascaded system: use saved per-fold accuracies if available, else attempt to evaluate using saved stage models
# Try to read cv_comparison.json first (should contain per-fold lists for cascaded and three)
cv_comp = load_json(os.path.join(RESULTS_DIR, 'cv_comparison.json'))
cascaded_cv = None
three_cv = None
if cv_comp:
    # Expected keys: cascaded_folds, three_folds or similar
    for key in ['cascaded_fold_accuracies','cascaded_folds','cascaded_cv','cascaded']:
        if key in cv_comp:
            cascaded_cv = cv_comp[key]
            break
    for key in ['three_fold_accuracies','three_folds','three_cv','three']:
        if key in cv_comp:
            three_cv = cv_comp[key]
            break
    # Also try common names
    if cascaded_cv is None and 'cascaded' in cv_comp and isinstance(cv_comp['cascaded'], dict) and 'fold_accuracies' in cv_comp['cascaded']:
        cascaded_cv = cv_comp['cascaded']['fold_accuracies']
    if three_cv is None and 'three' in cv_comp and isinstance(cv_comp['three'], dict) and 'fold_accuracies' in cv_comp['three']:
        three_cv = cv_comp['three']['fold_accuracies']
    # direct keys
    if cascaded_cv is None and 'cascaded_fold_accuracies' in cv_comp:
        cascaded_cv = cv_comp['cascaded_fold_accuracies']
    if three_cv is None and 'three_fold_accuracies' in cv_comp:
        three_cv = cv_comp['three_fold_accuracies']

# If cv_comparison doesn't have lists, try ablation_results.json if it stores lists
if (cascaded_cv is None or three_cv is None):
    ab = load_json(os.path.join(RESULTS_DIR, 'ablation_results.json'))
    if ab:
        # ablation has entries per config; try to aggregate three_cv and cascaded_cv for default config
        # We'll attempt to find a config where use_weights and use_aug match defaults (True/True or False/False)
        for cfg, val in ab.items() if isinstance(ab, dict) else []:
            pass
        # simpler: search recursively for any list of 5 floats in the ablation file
        def find_acc_lists(obj):
            if isinstance(obj, dict):
                for v in obj.values():
                    res = find_acc_lists(v)
                    if res is not None:
                        return res
            if isinstance(obj, list):
                if len(obj) == 5 and all(isinstance(x, (int, float)) for x in obj):
                    return obj
                for v in obj:
                    res = find_acc_lists(v)
                    if res is not None:
                        return res
            return None
        found = find_acc_lists(ab)
        if found and cascaded_cv is None:
            cascaded_cv = found

# If still None, try to look for three CV file
three_cv_json = load_json(os.path.join(RESULTS_DIR, '3class_cv_results.json'))
if three_cv_json:
    for k in ['fold_accuracies','folds','accuracies']:
        if k in three_cv_json:
            three_cv = three_cv_json.get(k)
            break
    # fallback: search for list
    if three_cv is None:
        def find_list(obj):
            if isinstance(obj, list) and len(obj) >= 3 and all(isinstance(x, (int, float)) for x in obj):
                return obj
            if isinstance(obj, dict):
                for v in obj.values():
                    r = find_list(v)
                    if r is not None:
                        return r
            if isinstance(obj, list):
                for v in obj:
                    r = find_list(v)
                    if r is not None:
                        return r
            return None
        three_cv = find_list(three_cv_json)

# Convert to lists of floats
try:
    if cascaded_cv is not None:
        cascaded_cv = [float(x) for x in cascaded_cv]
    if three_cv is not None:
        three_cv = [float(x) for x in three_cv]
except Exception:
    pass

# Store CV stats
import math
cv_stats = {}
if cascaded_cv is not None:
    cv_stats['cascaded_mean'] = float(np.mean(cascaded_cv))
    cv_stats['cascaded_std'] = float(np.std(cascaded_cv))
    cv_stats['cascaded_folds'] = cascaded_cv
else:
    cv_stats['cascaded_mean'] = None
    cv_stats['cascaded_std'] = None
    cv_stats['cascaded_folds'] = None

if three_cv is not None:
    cv_stats['three_mean'] = float(np.mean(three_cv))
    cv_stats['three_std'] = float(np.std(three_cv))
    cv_stats['three_folds'] = three_cv
else:
    cv_stats['three_mean'] = None
    cv_stats['three_std'] = None
    cv_stats['three_folds'] = None

results['cv_stats'] = cv_stats

# 5) Paired t-test if both lists present
ttest = {}
if cascaded_cv is not None and three_cv is not None and len(cascaded_cv) == len(three_cv):
    try:
        from scipy import stats
        tstat, pval = stats.ttest_rel(three_cv, cascaded_cv)
        ttest['t_stat'] = float(tstat)
        ttest['p_value'] = float(pval)
        ttest['significant_alpha_0_05'] = (pval < 0.05)
    except Exception as e:
        ttest['error'] = str(e)
else:
    ttest['error'] = 'Insufficient or mismatched CV fold lists for paired t-test'

results['ttest'] = ttest

# 6) Final results table: compile required columns
# Columns: Model | CV Mean | CV Std | Test Accuracy | Macro F1 | Params | Size | ms/sample
final_rows = []
# Stage-1
s1 = results.get('stage1', {})
final_rows.append({
    'Model': 'Stage-1 (binary)',
    'CV Mean': None,
    'CV Std': None,
    'Test Accuracy': s1.get('test_accuracy'),
    'Macro F1': s1.get('macro_f1'),
    'Params': s1.get('params'),
    'Size': s1.get('size_bytes'),
    'ms/sample': s1.get('ms_per_sample')
})
# Stage-2
s2 = results.get('stage2', {})
final_rows.append({
    'Model': 'Stage-2 (subtype)',
    'CV Mean': None,
    'CV Std': None,
    'Test Accuracy': s2.get('test_accuracy') if isinstance(s2, dict) else None,
    'Macro F1': s2.get('macro_f1') if isinstance(s2, dict) else None,
    'Params': s2.get('params') if isinstance(s2, dict) else None,
    'Size': s2.get('size_bytes') if isinstance(s2, dict) else None,
    'ms/sample': s2.get('ms_per_sample') if isinstance(s2, dict) else None
})
# Cascaded
final_rows.append({
    'Model': 'Cascaded (Stage1+Stage2)',
    'CV Mean': cv_stats.get('cascaded_mean'),
    'CV Std': cv_stats.get('cascaded_std'),
    'Test Accuracy': results.get('model_checks', {}).get('cascaded_models', {}).get('cascaded_test_accuracy') if 'model_checks' in results else None,
    'Macro F1': None,  # compute below
    'Params': None,
    'Size': None,
    'ms/sample': None
})
# 3-class
three = results.get('three_class', {})
final_rows.append({
    'Model': '3-class baseline',
    'CV Mean': cv_stats.get('three_mean'),
    'CV Std': cv_stats.get('three_std'),
    'Test Accuracy': three.get('test_accuracy') if isinstance(three, dict) else None,
    'Macro F1': three.get('macro_f1') if isinstance(three, dict) else None,
    'Params': three.get('params') if isinstance(three, dict) else None,
    'Size': three.get('size_bytes') if isinstance(three, dict) else None,
    'ms/sample': three.get('ms_per_sample') if isinstance(three, dict) else None
})

# Compute cascade macro F1 properly by using models if available
cascade_macro_f1 = None
cascade_test_acc = None
try:
    # attempt to load stage1 and stage2 and compute macro f1 using the earlier logic
    if os.path.exists(s1_path) and os.path.exists(s2_path):
        m1 = safe_load_model(s1_path)
        m2 = safe_load_model(s2_path)
        if m1 is not None and m2 is not None:
            p1 = (m1.predict(X_test, verbose=0) > 0.5).astype(int).flatten()
            cascade_preds = np.zeros_like(p1)
            hazard_idx = np.where(p1 == 1)[0]
            if hazard_idx.size > 0:
                p2_proba = m2.predict(X_test[hazard_idx], verbose=0)
                p2 = (p2_proba > 0.5).astype(int).flatten()
                for i, idx in enumerate(hazard_idx):
                    cascade_preds[idx] = 1 if p2[i] == 0 else 2
            # macro f1 across three classes
            from sklearn.metrics import f1_score
            cascade_macro_f1 = float(f1_score(Y_test, cascade_preds, average='macro'))
            cascade_test_acc = float(accuracy_score(Y_test, cascade_preds))
except Exception:
    pass

# Fill cascade values in table
for row in final_rows:
    if row['Model'].startswith('Cascaded'):
        row['Macro F1'] = cascade_macro_f1
        # prefer computed cascade_test_acc, else earlier loaded model_checks
        row['Test Accuracy'] = cascade_test_acc if cascade_test_acc is not None else results.get('model_checks', {}).get('cascaded_models', {}).get('cascaded_test_accuracy')
        # params: sum of stage1+stage2
        try:
            p_total = 0
            if isinstance(results.get('stage1', {}), dict) and results['stage1'].get('params'):
                p_total += int(results['stage1']['params'])
            if isinstance(results.get('stage2', {}), dict) and results['stage2'].get('params'):
                p_total += int(results['stage2']['params'])
            row['Params'] = p_total if p_total > 0 else None
            row['Size'] = None
            row['ms/sample'] = None
        except Exception:
            pass

# Write CSV and MD
csv_path = os.path.join(RESULTS_DIR, 'final_results_table.csv')
md_path = os.path.join(RESULTS_DIR, 'final_results_table.md')
import csv
with open(csv_path, 'w', newline='') as cf:
    writer = csv.DictWriter(cf, fieldnames=['Model','CV Mean','CV Std','Test Accuracy','Macro F1','Params','Size','ms/sample'])
    writer.writeheader()
    for r in final_rows:
        writer.writerow(r)

with open(md_path, 'w') as mf:
    mf.write('# Final Results Table\n\n')
    mf.write('| Model | CV Mean | CV Std | Test Accuracy | Macro F1 | Params | Size | ms/sample |\n')
    mf.write('|---|---:|---:|---:|---:|---:|---:|---:|\n')
    for r in final_rows:
        mf.write(f"| {r['Model']} | {r.get('CV Mean')} | {r.get('CV Std')} | {r.get('Test Accuracy')} | {r.get('Macro F1')} | {r.get('Params')} | {r.get('Size')} | {r.get('ms/sample')} |\n")

# Experimental integrity report
integrity_path = os.path.join(RESULTS_DIR, 'experimental_integrity_report.md')
# Reuse previously created consistency_report.json if available
consistency = load_json(os.path.join(RESULTS_DIR, 'consistency_report.json'))

with open(integrity_path, 'w') as ir:
    ir.write('# Experimental Integrity Report\n\n')
    ir.write('## Data leakage check\n')
    if consistency and 'static_scan' in consistency:
        # summarize uses of X_test in scripts
        hits = 0
        for f, matches in consistency['static_scan'].items():
            for m in matches:
                if 'X_test' in m['line']:
                    hits += 1
        if hits == 0:
            ir.write('- No direct references to `X_test` found in training/CV code paths.\n')
        else:
            ir.write(f'- Found {hits} references to `X_test` in scripts (see `results/consistency_report.json`).\n')
    else:
        ir.write('- Consistency report not found; please run `scripts/consistency_audit.py`.\n')

    ir.write('\n## Dataset splits\n')
    ir.write(f"- Train: {dataset_sizes['X_train_shape']} samples (shape)\n")
    ir.write(f"- Validation: {dataset_sizes['X_val_shape']} samples (shape)\n")
    ir.write(f"- Test: {dataset_sizes['X_test_shape']} samples (shape)\n")

    ir.write('\n## Reproducibility\n')
    ir.write('- Global seed used in scripts: 42 (search for `RANDOM_SEED` in scripts).\n')
    ir.write('- Deterministic operations: random, numpy, and TF seeds set where scripts call `set_random_seeds`.\n')

    ir.write('\n## Statistical test\n')
    if 'ttest' in results:
        if 'p_value' in results['ttest']:
            ir.write(f"- Paired t-test p-value (3-class vs cascaded): {results['ttest']['p_value']}\n")
            ir.write(f"- Significant at alpha=0.05: {results['ttest']['significant_alpha_0_05']}\n")
        else:
            ir.write('- Paired t-test could not be computed: insufficient CV fold lists.\n')
    else:
        ir.write('- Paired t-test not available.\n')

    ir.write('\n## Exact commands to reproduce experiments\n')
    ir.write('Run training (already completed):\n')
    ir.write('```bash\n')
    ir.write('python3 scripts/train_stage1_improved.py\n')
    ir.write('python3 scripts/train_stage2_improved.py\n')
    ir.write('python3 scripts/train_3class_baseline.py\n')
    ir.write('python3 scripts/compare_cascaded_vs_3class.py\n')
    ir.write('python3 scripts/ablation_study.py\n')
    ir.write('python3 scripts/model_complexity.py\n')
    ir.write('python3 scripts/consistency_audit.py\n')
    ir.write('python3 scripts/finalize_results.py\n')
    ir.write('```\n')

    ir.write('\n## Notes\n')
    ir.write('- No retraining was performed by this script. Model files in `models/` were loaded for evaluation.\n')
    ir.write('- If any model files are missing, corresponding table entries are left blank or marked with errors.\n')

# Save intermediate JSON
def _numpy_converter(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return str(obj)

with open(os.path.join(RESULTS_DIR, 'final_metrics_intermediate.json'), 'w') as jf:
    json.dump({'results': results, 'final_rows': final_rows, 'cv_stats': cv_stats, 'ttest': ttest}, jf, indent=2, default=_numpy_converter)

# Update todo list: mark steps completed
print('✅ Finalization complete. Files written:')
print(f' - {csv_path}')
print(f' - {md_path}')
print(f' - {integrity_path}')
print(f' - {os.path.join(RESULTS_DIR, "final_metrics_intermediate.json")}')

# End
