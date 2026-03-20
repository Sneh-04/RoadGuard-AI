#!/usr/bin/env python3
"""
DATASET ANALYSIS REPORT: Generate comprehensive dataset statistics and visualizations.

This script produces:
- Class distribution analysis
- Statistical summaries per axis
- Imbalance metrics
- Publication-ready figures
"""

import os
import json
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

# ====== PATHS ======
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed_accel_only_fixed")
from config import RESULTS_DIR

os.makedirs(RESULTS_DIR, exist_ok=True)

print("=" * 70)
print("DATASET ANALYSIS REPORT")
print("=" * 70)
print()

# ====== LOAD DATA ======
print("Loading dataset...")
X_train = np.load(os.path.join(DATA_DIR, "X_train.npy"))
y_train = np.load(os.path.join(DATA_DIR, "y_train.npy"))
X_val = np.load(os.path.join(DATA_DIR, "X_val.npy"))
y_val = np.load(os.path.join(DATA_DIR, "y_val.npy"))
X_test = np.load(os.path.join(DATA_DIR, "X_test.npy"))
y_test = np.load(os.path.join(DATA_DIR, "y_test.npy"))

X_all = np.concatenate([X_train, X_val, X_test], axis=0)
y_all = np.concatenate([y_train, y_val, y_test], axis=0)

print(f"Total samples: {len(y_all)}")
print(f"Training samples: {len(y_train)}")
print(f"Validation samples: {len(y_val)}")
print(f"Test samples: {len(y_test)}")
print()

# ====== CLASS DISTRIBUTION ======
print("=" * 70)
print("CLASS DISTRIBUTION ANALYSIS")
print("=" * 70)
print()

class_names = ["Normal", "Speedbreaker", "Pothole"]
class_colors = ["#1f77b4", "#ff7f0e", "#2ca02c"]

def analyze_split(y, split_name):
    dist = np.bincount(y, minlength=3)
    percentages = 100 * dist / len(y)
    
    print(f"{split_name}:")
    for i, (count, pct) in enumerate(zip(dist, percentages)):
        print(f"  {class_names[i]:15s}: {count:4d} ({pct:5.1f}%)")
    return dist

train_dist = analyze_split(y_train, "Training")
val_dist = analyze_split(y_val, "Validation")
test_dist = analyze_split(y_test, "Test")
all_dist = analyze_split(y_all, "All Data")

print()

# ====== IMBALANCE METRICS ======
print("=" * 70)
print("CLASS IMBALANCE METRICS")
print("=" * 70)
print()

imbalance_ratio = all_dist[1] / all_dist[2]
print(f"Imbalance Ratio (Speedbreaker:Pothole): {imbalance_ratio:.2f}:1")
print(f"Minority class percentage: {100*all_dist[2]/len(y_all):.2f}%")
print()

# ====== STATISTICAL SUMMARY ======
print("=" * 70)
print("SENSOR DATA STATISTICS")
print("=" * 70)
print()

axes_names = ["X-axis (accel)", "Y-axis (accel)", "Z-axis (accel)"]

stats_data = []
for axis in range(3):
    data = X_all[:, :, axis].flatten()
    stats = {
        "Axis": axes_names[axis],
        "Mean": np.mean(data),
        "Std Dev": np.std(data),
        "Min": np.min(data),
        "Max": np.max(data),
        "Q1": np.percentile(data, 25),
        "Median": np.median(data),
        "Q3": np.percentile(data, 75)
    }
    stats_data.append(stats)
    
    print(f"{axes_names[axis]}:")
    print(f"  Mean:     {stats['Mean']:8.4f}")
    print(f"  Std Dev:  {stats['Std Dev']:8.4f}")
    print(f"  Min:      {stats['Min']:8.4f}")
    print(f"  Max:      {stats['Max']:8.4f}")
    print(f"  Median:   {stats['Median']:8.4f}")
    print()

stats_df = pd.DataFrame(stats_data)

# ====== GENERATE FIGURES ======
print("=" * 70)
print("GENERATING VISUALIZATIONS")
print("=" * 70)
print()

# Figure 1: Class Distribution Bar Chart
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

splits = [("Train", train_dist), ("Val", val_dist), ("Test", test_dist)]
for ax, (split_name, dist) in zip(axes, splits):
    percentages = 100 * dist / np.sum(dist)
    bars = ax.bar(class_names, dist, color=class_colors, edgecolor='black', linewidth=1.5)
    ax.set_ylabel('Number of Samples', fontsize=12)
    ax.set_title(f'{split_name} Set Distribution\n(n={np.sum(dist)})', fontsize=13, fontweight='bold')
    ax.grid(axis='y', alpha=0.3)
    
    # Add value labels on bars
    for bar, pct in zip(bars, percentages):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}\n({pct:.1f}%)',
                ha='center', va='bottom', fontsize=10)

plt.tight_layout()
fig_path = os.path.join(RESULTS_DIR, "class_distribution.png")
plt.savefig(fig_path, dpi=300, bbox_inches='tight')
plt.close()
print(f"✅ Saved: {fig_path}")

# Figure 2: Overall Class Distribution
fig, ax = plt.subplots(figsize=(10, 6))
percentages = 100 * all_dist / np.sum(all_dist)
wedges, texts, autotexts = ax.pie(all_dist, labels=class_names, autopct='%1.1f%%',
                                     colors=class_colors, startangle=90,
                                     textprops={'fontsize': 12})
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontweight('bold')
    autotext.set_fontsize(11)
ax.set_title('Overall Dataset Class Distribution\n(All Splits Combined)', 
             fontsize=14, fontweight='bold', pad=20)
fig_path = os.path.join(RESULTS_DIR, "class_distribution_pie.png")
plt.savefig(fig_path, dpi=300, bbox_inches='tight')
plt.close()
print(f"✅ Saved: {fig_path}")

# Figure 3: Imbalance Severity
fig, ax = plt.subplots(figsize=(10, 6))
ratios = all_dist / all_dist.min()
bars = ax.bar(class_names, ratios, color=class_colors, edgecolor='black', linewidth=1.5)
ax.axhline(y=1, color='red', linestyle='--', linewidth=2, label='Perfectly Balanced')
ax.set_ylabel('Relative Frequency (normalized to minority class)', fontsize=12)
ax.set_title('Class Imbalance Severity\n(Relative to Pothole - Minority Class)', 
             fontsize=13, fontweight='bold')
ax.grid(axis='y', alpha=0.3)
ax.legend(fontsize=11)

for bar, ratio in zip(bars, ratios):
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{ratio:.1f}x',
            ha='center', va='bottom', fontsize=11, fontweight='bold')

fig_path = os.path.join(RESULTS_DIR, "class_imbalance_severity.png")
plt.savefig(fig_path, dpi=300, bbox_inches='tight')
plt.close()
print(f"✅ Saved: {fig_path}")

# Figure 4: Sensor Data Statistics
fig, axes = plt.subplots(1, 3, figsize=(16, 5))

for axis_idx, (ax, axis_name) in enumerate(zip(axes, axes_names)):
    data = X_all[:, :, axis_idx].flatten()
    
    ax.hist(data, bins=50, color='steelblue', edgecolor='black', alpha=0.7)
    ax.axvline(np.mean(data), color='red', linestyle='--', linewidth=2, label=f'Mean: {np.mean(data):.2f}')
    ax.axvline(np.median(data), color='green', linestyle='--', linewidth=2, label=f'Median: {np.median(data):.2f}')
    
    ax.set_xlabel('Acceleration (m/s²)', fontsize=11)
    ax.set_ylabel('Frequency', fontsize=11)
    ax.set_title(f'{axis_name} Distribution', fontsize=12, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(alpha=0.3)

plt.tight_layout()
fig_path = os.path.join(RESULTS_DIR, "sensor_statistics.png")
plt.savefig(fig_path, dpi=300, bbox_inches='tight')
plt.close()
print(f"✅ Saved: {fig_path}")

# Figure 5: Box plots for each axis
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

for axis_idx, (ax, axis_name) in enumerate(zip(axes, axes_names)):
    data = X_all[:, :, axis_idx].flatten()
    
    bp = ax.boxplot(data, vert=True, patch_artist=True)
    bp['boxes'][0].set_facecolor('lightblue')
    bp['boxes'][0].set_edgecolor('black')
    
    ax.set_ylabel('Acceleration (m/s²)', fontsize=11)
    ax.set_title(f'{axis_name} Distribution', fontsize=12, fontweight='bold')
    ax.grid(axis='y', alpha=0.3)
    
    # Add stats text
    stats_text = f"Mean: {np.mean(data):.2f}\nStd: {np.std(data):.2f}\nMin: {np.min(data):.2f}\nMax: {np.max(data):.2f}"
    ax.text(1.3, np.mean(data), stats_text, fontsize=9, 
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

plt.tight_layout()
fig_path = os.path.join(RESULTS_DIR, "sensor_boxplots.png")
plt.savefig(fig_path, dpi=300, bbox_inches='tight')
plt.close()
print(f"✅ Saved: {fig_path}")

print()

# ====== SAVE REPORT JSON ======
report = {
    "dataset_overview": {
        "total_samples": int(len(y_all)),
        "training_samples": int(len(y_train)),
        "validation_samples": int(len(y_val)),
        "test_samples": int(len(y_test)),
        "window_size": 100,
        "features": 3,
        "feature_names": axes_names
    },
    "class_distribution": {
        "train": {"normal": int(train_dist[0]), "speedbreaker": int(train_dist[1]), "pothole": int(train_dist[2])},
        "val": {"normal": int(val_dist[0]), "speedbreaker": int(val_dist[1]), "pothole": int(val_dist[2])},
        "test": {"normal": int(test_dist[0]), "speedbreaker": int(test_dist[1]), "pothole": int(test_dist[2])},
        "overall": {"normal": int(all_dist[0]), "speedbreaker": int(all_dist[1]), "pothole": int(all_dist[2])}
    },
    "class_percentages": {
        "overall": {
            "normal": float(100*all_dist[0]/len(y_all)),
            "speedbreaker": float(100*all_dist[1]/len(y_all)),
            "pothole": float(100*all_dist[2]/len(y_all))
        }
    },
    "imbalance_metrics": {
        "imbalance_ratio": float(imbalance_ratio),
        "minority_class_percentage": float(100*all_dist[2]/len(y_all))
    },
    "sensor_statistics": stats_df.to_dict('records')
}

report_path = os.path.join(RESULTS_DIR, "dataset_report.json")
with open(report_path, 'w') as f:
    json.dump(report, f, indent=2)
print(f"✅ Saved: {report_path}")
print()

# ====== PRINT FINAL SUMMARY ======
print("=" * 70)
print("SUMMARY")
print("=" * 70)
print()
print(f"Total dataset size: {len(y_all)} samples")
print(f"Class balance: {all_dist[0]} Normal : {all_dist[1]} Speedbreaker : {all_dist[2]} Pothole")
print(f"Imbalance ratio: {imbalance_ratio:.2f}:1 (Speedbreaker:Pothole)")
print(f"Minority class: {100*all_dist[2]/len(y_all):.2f}% (Pothole)")
print()
print("Generated files:")
print("  - class_distribution.png")
print("  - class_distribution_pie.png")
print("  - class_imbalance_severity.png")
print("  - sensor_statistics.png")
print("  - sensor_boxplots.png")
print("  - dataset_report.json")
print()
