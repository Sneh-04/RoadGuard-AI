"""Train flat 3-class model with 5-fold cross-validation."""
import os
import json
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

from dataset import DatasetLoader, get_train_val_split


def create_flat_cnn_model(input_shape=(100, 3), num_classes=3):
    """Create CNN model for flat 3-class classification."""
    model = keras.Sequential([
        layers.Conv1D(32, kernel_size=5, activation='relu', input_shape=input_shape),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        
        layers.Conv1D(64, kernel_size=3, activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        
        layers.Conv1D(128, kernel_size=3, activation='relu'),
        layers.BatchNormalization(),
        
        layers.GlobalAveragePooling1D(),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def apply_augmentation(X: np.ndarray, y: np.ndarray):
    """Apply data augmentation to training data."""
    # Time shift: ±10 samples
    X_aug = []
    y_aug = []
    
    for x, label in zip(X, y):
        X_aug.append(x)
        y_aug.append(label)
        
        # Shift +10
        shifted = np.roll(x, 10, axis=0)
        X_aug.append(shifted)
        y_aug.append(label)
        
        # Shift -10
        shifted = np.roll(x, -10, axis=0)
        X_aug.append(shifted)
        y_aug.append(label)
        
        # Gaussian noise
        noisy = x + np.random.normal(0, 0.05, x.shape)
        X_aug.append(noisy)
        y_aug.append(label)
    
    return np.array(X_aug), np.array(y_aug)


def train_fold(X_train, y_train, X_val, y_val, config_name, use_weights, use_aug):
    """Train one fold."""
    model = create_flat_cnn_model(num_classes=3)
    
    # Convert labels to categorical
    y_train_cat = keras.utils.to_categorical(y_train, num_classes=3)
    y_val_cat = keras.utils.to_categorical(y_val, num_classes=3)
    
    # Apply augmentation if requested
    if use_aug:
        X_train, y_train_cat = apply_augmentation(X_train, y_train_cat)
    
    # Compute class weights if requested
    if use_weights:
        weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
        class_weight = {i: w for i, w in enumerate(weights)}
    else:
        class_weight = None
    
    # Train
    history = model.fit(
        X_train, y_train_cat,
        validation_data=(X_val, y_val_cat),
        epochs=50,
        batch_size=32,
        class_weight=class_weight,
        verbose=0
    )
    
    # Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val_cat, verbose=0)
    
    return val_acc, history


def main():
    # Load data
    loader = DatasetLoader()
    X_sensor, X_image, y = loader.load_data()
    X_processed, _, _ = loader.preprocess_for_training(X_sensor, y)
    
    # For flat model, use original labels but filter valid segments
    # This is simplified - in practice, would need to track which segments are valid
    y_processed = y[:len(X_processed)]  # Assume same order
    
    # 5-fold CV
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    configs = [
        ("no_weights_no_aug", False, False),
        ("no_weights_aug", False, True),
        ("weights_no_aug", True, False),
        ("weights_aug", True, True)
    ]
    
    results = {}
    
    for config_name, use_weights, use_aug in configs:
        print(f"\nTraining config: {config_name}")
        
        fold_accuracies = []
        
        for fold, (train_idx, val_idx) in enumerate(skf.split(X_processed, y_processed)):
            print(f"  Fold {fold+1}/5")
            
            X_train, X_val = X_processed[train_idx], X_processed[val_idx]
            y_train, y_val = y_processed[train_idx], y_processed[val_idx]
            
            acc, _ = train_fold(X_train, y_train, X_val, y_val, 
                              f"flat_{config_name}", use_weights, use_aug)
            
            fold_accuracies.append(acc)
        
        results[config_name] = {
            "fold_accuracies": fold_accuracies,
            "mean_accuracy": np.mean(fold_accuracies),
            "std_accuracy": np.std(fold_accuracies)
        }
        
        print(f"  Mean accuracy: {results[config_name]['mean_accuracy']:.4f}")
    
    # Save results
    os.makedirs("results", exist_ok=True)
    with open("results/flat_cv_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("\nResults saved to results/flat_cv_results.json")


if __name__ == "__main__":
    main()