# Experimental Integrity Report

## Data leakage check
- Found 43 references to `X_test` in scripts (see `results/consistency_report.json`).

## Dataset splits
- Train: [611, 100, 3] samples (shape)
- Validation: [131, 100, 3] samples (shape)
- Test: [132, 100, 3] samples (shape)

## Reproducibility
- Global seed used in scripts: 42 (search for `RANDOM_SEED` in scripts).
- Deterministic operations: random, numpy, and TF seeds set where scripts call `set_random_seeds`.

## Statistical test
- Paired t-test p-value (3-class vs cascaded): 0.05546478833990092
- Significant at alpha=0.05: False

## Exact commands to reproduce experiments
Run training (already completed):
```bash
python3 scripts/train_stage1_improved.py
python3 scripts/train_stage2_improved.py
python3 scripts/train_3class_baseline.py
python3 scripts/compare_cascaded_vs_3class.py
python3 scripts/ablation_study.py
python3 scripts/model_complexity.py
python3 scripts/consistency_audit.py
python3 scripts/finalize_results.py
```

## Notes
- No retraining was performed by this script. Model files in `models/` were loaded for evaluation.
- If any model files are missing, corresponding table entries are left blank or marked with errors.
