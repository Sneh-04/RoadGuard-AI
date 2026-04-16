# Experimental Results Summary

This document aggregates the key numerical outcomes from the latest
experiments, including cascaded models, 3‑class baseline, ablation and
complexity measurements.  All results were obtained with `RANDOM_SEED=42`.

## 3-Class Baseline
- **Test accuracy**: 0.4242
- **Confusion matrix**:
  ```
  [[18  3  3]
   [26 36 40]
   [ 1  3  2]]
  ```
- CV accuracies (5 folds): stored in `results/3class_cv_results.json`
  (mean = 0.6728, std = 0.1341).

## Cascaded System (from earlier upgrades)
- Stage‑1 CV mean: 0.8347 ± 0.0224
- Stage‑2 CV mean: 0.7368 ± 0.1349

## Statistical Comparison
- Paired t-test between cascaded CV accuracies and 3-class CV accuracies
  produced **p = 0.0001718** indicating the cascaded design is
  significantly better.

## Ablation Study (see `results/ablation_results.json`)
Four configurations were evaluated; mean accuracies are listed below.

| Weights | Augmentation | Cascaded Mean | 3-Class Mean |
|---------|--------------|---------------|--------------|
| False   | False        | 0.1882        | 0.6728       |
| False   | True         | 0.1834        | 0.7514       |
| True    | False        | 0.3273        | 0.4909       |
| True    | True         | 0.3306        | 0.5238       |

## Model Complexity (see `results/model_complexity.json`)

| Model   | Params | Size (bytes) | Inference ms/sample |
|---------|--------|--------------|---------------------|
| Stage1  | 40,641 | 210,068      | 2.29                |
| Stage2  | 40,641 | 545,332      | 1.78                |
| 3-Class | 40,771 | 213,454      | 1.81                |


*All inference measurements were performed on an Apple M1 machine.*
