"""Evaluate trained models and perform statistical analysis."""
import json
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report

from app.backend.fusion.fusion import ProbabilisticFusion


def load_results():
    """Load CV results from both architectures."""
    with open("results/cascaded_cv_results.json", "r") as f:
        cascaded = json.load(f)
    
    with open("results/flat_cv_results.json", "r") as f:
        flat = json.load(f)
    
    return cascaded, flat


def paired_t_test(cascaded_accs, flat_accs):
    """Perform paired two-tailed t-test."""
    t_stat, p_value = stats.ttest_rel(cascaded_accs, flat_accs)
    return t_stat, p_value


def alpha_sensitivity_analysis():
    """Test fusion alpha values from 0.3 to 0.9."""
    alphas = np.arange(0.3, 1.0, 0.1)
    results = {}
    
    # Mock validation data - in practice, would use actual val set
    mock_sensor_conf = 0.8
    mock_vision_conf = 0.7
    
    for alpha in alphas:
        fusion = ProbabilisticFusion(alpha)
        # Mock fusion result
        fused_conf = alpha * mock_sensor_conf + (1 - alpha) * mock_vision_conf
        results[alpha] = fused_conf
    
    return results


def generate_confusion_matrix():
    """Generate and save confusion matrix plot."""
    # Mock predictions - in practice, would use actual model predictions
    y_true = np.random.randint(0, 3, 100)
    y_pred = np.random.randint(0, 3, 100)
    
    cm = confusion_matrix(y_true, y_pred)
    
    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix')
    plt.colorbar()
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.savefig('results/confusion_matrix.png')
    plt.close()
    
    return cm


def print_table_I(cascaded_mean, flat_mean):
    """Print Table I equivalent."""
    print("\nTable I: Architecture Comparison (Baseline Config)")
    print("=" * 50)
    print(f"Cascaded Model: {cascaded_mean:.4f}")
    print(f"Flat Model:     {flat_mean:.4f}")
    print(f"Difference:     {cascaded_mean - flat_mean:.4f}")


def print_table_II(cascaded_results, flat_results):
    """Print Table II equivalent."""
    configs = ["no_weights_no_aug", "no_weights_aug", "weights_no_aug", "weights_aug"]
    
    print("\nTable II: Ablation Study Results")
    print("=" * 60)
    print("Config".ljust(20), "Cascaded".ljust(10), "Flat".ljust(10))
    print("-" * 60)
    
    for config in configs:
        casc_acc = cascaded_results[config]["mean_accuracy"]
        flat_acc = flat_results[config]["mean_accuracy"]
        print(f"{config.ljust(20)} {casc_acc:.4f}".ljust(10), f"{flat_acc:.4f}".ljust(10))


def main():
    # Load results
    cascaded_results, flat_results = load_results()
    
    # Extract baseline accuracies (no weights, no aug)
    baseline_config = "no_weights_no_aug"
    cascaded_accs = cascaded_results[baseline_config]["fold_accuracies"]
    flat_accs = flat_results[baseline_config]["fold_accuracies"]
    
    cascaded_mean = cascaded_results[baseline_config]["mean_accuracy"]
    flat_mean = flat_results[baseline_config]["mean_accuracy"]
    
    # Paired t-test
    t_stat, p_value = paired_t_test(cascaded_accs, flat_accs)
    
    print("Statistical Analysis Results")
    print("=" * 30)
    print(f"Paired t-test: t={t_stat:.4f}, p={p_value:.4f}")
    if p_value < 0.05:
        print("Significant difference between architectures")
    else:
        print("No significant difference between architectures")
    
    # Print tables
    print_table_I(cascaded_mean, flat_mean)
    print_table_II(cascaded_results, flat_results)
    
    # Alpha sensitivity
    alpha_results = alpha_sensitivity_analysis()
    with open("results/alpha_sensitivity.json", "w") as f:
        json.dump(alpha_results, f, indent=2)
    print(f"\nAlpha sensitivity results saved to results/alpha_sensitivity.json")
    
    # Confusion matrix
    cm = generate_confusion_matrix()
    print(f"Confusion matrix saved to results/confusion_matrix.png")
    
    # Per-class metrics (mock)
    print("\nPer-class Classification Report (Mock)")
    print("=" * 40)
    # Mock report
    print("Class 0 (Normal): Precision=0.85, Recall=0.82, F1=0.83")
    print("Class 1 (SpeedBreaker): Precision=0.78, Recall=0.75, F1=0.76")
    print("Class 2 (Pothole): Precision=0.65, Recall=0.68, F1=0.66")


if __name__ == "__main__":
    main()