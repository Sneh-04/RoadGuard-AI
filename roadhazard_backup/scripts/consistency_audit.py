#!/usr/bin/env python3
"""
Consistency audit for experiments and scripts.

Performs quick static checks (searches for test-set leakage patterns,
augmentation misuse, checkpoint/monitor usage) and dynamic checks
(dataset sizes, recompute CV means/std from result JSONs, evaluate
saved models on the test set and compare with saved test metrics).

Saves `results/consistency_report.json` and `results/consistency_report.md`.
"""
import os
import sys
import json
import glob
import re
import numpy as np
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")
DATA_DIR = os.path.join(BASE_DIR, "data", "processed_accel_only_fixed")
from config import MODEL_DIR as MODELS_DIR, RESULTS_DIR

os.makedirs(RESULTS_DIR, exist_ok=True)

def load_json_safe(path):
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except Exception:
        return None

def scan_scripts(patterns):
    findings = {}
    py_files = glob.glob(os.path.join(SCRIPTS_DIR, "*.py"))
    for p in py_files:
        with open(p, 'r') as f:
            txt = f.read()
        matches = []
        for name, pat in patterns.items():
            for m in re.finditer(pat, txt):
                # capture line number and context
                start = txt.rfind('\n', 0, m.start()) + 1
                end = txt.find('\n', m.end())
                if end == -1:
                    end = len(txt)
                line = txt[start:end].strip()
                lineno = txt.count('\n', 0, m.start()) + 1
                matches.append({'lineno': lineno, 'line': line})
        findings[os.path.basename(p)] = matches
    return findings

def recompute_cv_stats(result_files):
    out = {}
    for name, path in result_files.items():
        data = load_json_safe(path)
        if not data:
            out[name] = {'found': False}
            continue
        # try to locate fold accuracy lists in common keys
        accs = None
        for key in ['fold_accuracies', 'fold_accuracy', 'fold_acc', 'three_fold_accuracies', 'folds']:
            if key in data:
                accs = data[key]
                break
        # some files store nested structures (ablation), handle lists of lists
        if accs is None:
            # search recursively for any list of 3+ floats that look like accuracies
            def find_acc_lists(obj):
                if isinstance(obj, dict):
                    for v in obj.values():
                        res = find_acc_lists(v)
                        if res is not None:
                            return res
                if isinstance(obj, list):
                    # list of floats
                    if len(obj) >= 3 and all(isinstance(x, (int, float)) for x in obj):
                        return obj
                    for v in obj:
                        res = find_acc_lists(v)
                        if res is not None:
                            return res
                return None
            accs = find_acc_lists(data)

        if accs is None:
            out[name] = {'found': True, 'accuracy_list_found': False}
        else:
            accs = [float(a) for a in accs]
            out[name] = {
                'found': True,
                'n_folds': len(accs),
                'mean': float(np.mean(accs)),
                'std': float(np.std(accs)),
                'accuracies': accs
            }
    return out

def evaluate_saved_model_on_test(model_path, x_test, y_test):
    try:
        import tensorflow as tf
        model = tf.keras.models.load_model(model_path)
        proba = model.predict(x_test, verbose=0)
        if proba.ndim > 1 and proba.shape[1] > 1:
            preds = np.argmax(proba, axis=1)
        else:
            preds = (proba > 0.5).astype(int).flatten()
        acc = float((preds == y_test).mean())
        return {'loaded': True, 'accuracy': acc}
    except Exception as e:
        return {'loaded': False, 'error': str(e)}

def main():
    report = {}

    # 1) Dataset sizes
    report['data_files'] = {}
    for name in ['X_train.npy','y_train.npy','X_val.npy','y_val.npy','X_test.npy','y_test.npy']:
        path = os.path.join(DATA_DIR, name)
        if os.path.exists(path):
            try:
                arr = np.load(path)
                report['data_files'][name] = {'exists': True, 'shape': list(arr.shape)}
            except Exception as e:
                report['data_files'][name] = {'exists': True, 'error': str(e)}
        else:
            report['data_files'][name] = {'exists': False}

    # 2) Static script scans
    patterns = {
        'uses_X_test': r'\bX_test\b',
        'loads_X_test_file': r'X_test\.npy',
        'augment_call': r'augment_batch\s*\(',
        'modelcheckpoint_val': r'ModelCheckpoint\([^\)]*save_best_only\s*=\s*True[^\)]*\)',
        'monitor_val': r"monitor\s*=\s*['\"]val_",
    }
    report['static_scan'] = scan_scripts(patterns)

    # 3) Check augmentation usage lines for potential test augmentation
    aug_findings = []
    for fname, matches in report['static_scan'].items():
        for m in matches:
            if 'augment_batch' in m['line']:
                aug_findings.append({'file': fname, 'lineno': m['lineno'], 'line': m['line']})
    report['augmentation_calls'] = aug_findings

    # 4) Recompute CV stats from results files we expect
    candidate_result_files = {
        '3class_cv': os.path.join(RESULTS_DIR, '3class_cv_results.json'),
        'ablation': os.path.join(RESULTS_DIR, 'ablation_results.json'),
        'cv_comparison': os.path.join(RESULTS_DIR, 'cv_comparison.json'),
        'stage1_cv': os.path.join(RESULTS_DIR, 'stage1_cv_results.json'),
        'stage2_cv': os.path.join(RESULTS_DIR, 'stage2_cv_results.json'),
    }
    report['recomputed_cv'] = recompute_cv_stats(candidate_result_files)

    # 5) Evaluate saved models on test set and compare to saved metrics
    # Load test data
    try:
        X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
        y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
    except Exception as e:
        X_test, y_test = None, None
        report['test_data_error'] = str(e)

    model_checks = {}
    # 3-class final model
    three_model_path = os.path.join(MODELS_DIR, '3class_baseline.keras')
    if X_test is not None and os.path.exists(three_model_path):
        # Map y_test to 3-class labels if necessary
        # The 3-class model expects labels in {0,1,2} as original
        res = evaluate_saved_model_on_test(three_model_path, X_test, y_test)
        model_checks['3class_baseline.keras'] = res
        # compare to stored metrics if present
        metrics = load_json_safe(os.path.join(RESULTS_DIR, '3class_test_metrics.json'))
        if metrics and 'accuracy' in metrics:
            model_checks['3class_baseline.keras']['reported_accuracy'] = float(metrics['accuracy'])
    else:
        model_checks['3class_baseline.keras'] = {'exists': os.path.exists(three_model_path)}

    # Stage1 and Stage2 final models (for cascaded inference)
    s1 = os.path.join(MODELS_DIR, 'stage1_binary_v2.keras')
    s2 = os.path.join(MODELS_DIR, 'stage2_subtype_v2.keras')
    if X_test is not None and os.path.exists(s1) and os.path.exists(s2):
        try:
            import tensorflow as tf
            m1 = tf.keras.models.load_model(s1)
            m2 = tf.keras.models.load_model(s2)
            # Stage-1 predicts binary (0 normal, 1 hazard)
            p1 = (m1.predict(X_test, verbose=0) > 0.5).astype(int).flatten()
            # For hazard indices, run stage2 on those samples
            hazard_idx = np.where(p1 == 1)[0]
            cascade_preds = np.zeros_like(p1)
            if hazard_idx.size > 0:
                # prepare stage2 input: filter X_test
                p2_proba = m2.predict(X_test[hazard_idx], verbose=0)
                p2 = (p2_proba > 0.5).astype(int).flatten()  # 0 speedbreaker, 1 pothole
                # map back to original labels: normal=0, speedbreaker=1, pothole=2
                # For hazard_idx where p2==0 -> label 1, where p2==1 -> label 2
                for i, idx in enumerate(hazard_idx):
                    cascade_preds[idx] = 1 if p2[i] == 0 else 2
            # For non-hazard, label 0 already
            # Compare cascade_preds to y_test
            acc = float((cascade_preds == y_test).mean())
            model_checks['cascaded_models'] = {'loaded': True, 'cascaded_test_accuracy': acc}
            # try to pull reported metrics
            s1_metrics = load_json_safe(os.path.join(RESULTS_DIR, 'stage1_metrics.json'))
            s2_metrics = load_json_safe(os.path.join(RESULTS_DIR, 'stage2_metrics.json'))
            model_checks['cascaded_models']['stage1_reported'] = s1_metrics.get('test_accuracy') if s1_metrics else None
            model_checks['cascaded_models']['stage2_reported'] = s2_metrics.get('test_accuracy') if s2_metrics else None
        except Exception as e:
            model_checks['cascaded_models'] = {'loaded': False, 'error': str(e)}
    else:
        model_checks['cascaded_models'] = {'stage1_exists': os.path.exists(s1), 'stage2_exists': os.path.exists(s2)}

    report['model_checks'] = model_checks

    # 6) Verify that common scripts use StratifiedKFold with proper RNG
    skf_findings = {}
    for fname in glob.glob(os.path.join(SCRIPTS_DIR, '*.py')):
        txt = open(fname).read()
        if 'StratifiedKFold' in txt:
            m = re.search(r'StratifiedKFold\([^\)]*n_splits\s*=\s*(\d+)[^\)]*random_state\s*=\s*(\d+)', txt)
            skf_findings[os.path.basename(fname)] = bool(m)
    report['skf_uses_random_state'] = skf_findings

    # Save JSON report
    out_json = os.path.join(RESULTS_DIR, 'consistency_report.json')
    with open(out_json, 'w') as f:
        json.dump(report, f, indent=2)

    # Save human-readable MD
    out_md = os.path.join(RESULTS_DIR, 'consistency_report.md')
    with open(out_md, 'w') as f:
        f.write('# Consistency Audit Report\n\n')
        f.write('## Dataset Files\n')
        for k, v in report['data_files'].items():
            f.write(f'- `{k}`: {v}\n')
        f.write('\n## Static Script Findings\n')
        for fname, matches in report['static_scan'].items():
            f.write(f'- `{fname}`: {len(matches)} matches\n')
            for m in matches[:5]:
                f.write(f'  - Line {m["lineno"]}: `{m["line"]}`\n')
        f.write('\n## Augmentation Calls\n')
        for a in report['augmentation_calls']:
            f.write(f'- `{a}`\n')
        f.write('\n## Recomputed CV Stats\n')
        for k, v in report['recomputed_cv'].items():
            f.write(f'- `{k}`: {v}\n')
        f.write('\n## Model Checks\n')
        for k, v in report['model_checks'].items():
            f.write(f'- `{k}`: {v}\n')

    print(f"✅ Consistency report written to {out_json} and {out_md}")

if __name__ == '__main__':
    main()
