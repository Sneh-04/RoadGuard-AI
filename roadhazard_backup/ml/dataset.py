"""Dataset loading and preprocessing for training."""
import os
import pandas as pd
import numpy as np
from typing import Tuple, List
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from app.backend.preprocessing.preprocess import preprocess_accel


class DatasetLoader:
    """Load and preprocess accelerometer and image data for training."""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.label_encoder = LabelEncoder()
    
    def load_data(self) -> Tuple[np.ndarray, List[str], np.ndarray]:
        """Load accelerometer segments and image paths.
        
        Assumes data/accel_segments.csv with columns:
        - file_path: path to image file
        - label: 0=Normal, 1=SpeedBreaker, 2=Pothole
        - ax0, ay0, az0, ..., ax99, ay99, az99: accelerometer data
        
        Returns:
            X_sensor: (N, 100, 3) accelerometer data
            X_image: list of image file paths
            y: (N,) labels
        """
        csv_path = os.path.join(self.data_dir, "accel_segments.csv")
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset CSV not found: {csv_path}")
        
        df = pd.read_csv(csv_path)
        
        # Extract labels
        y = df['label'].values
        
        # Extract accelerometer data: reshape to (N, 100, 3)
        accel_cols = [col for col in df.columns if col.startswith(('ax', 'ay', 'az'))]
        accel_data = df[accel_cols].values
        N = len(df)
        X_sensor = accel_data.reshape(N, 100, 3)
        
        # Extract image paths
        X_image = df['file_path'].tolist()
        
        print(f"Loaded dataset: {N} samples")
        print(f"Class distribution:")
        unique, counts = np.unique(y, return_counts=True)
        for cls, count in zip(unique, counts):
            pct = count / N * 100
            print(f"  Class {cls}: {count} ({pct:.1f}%)")
        
        return X_sensor, X_image, y
    
    def preprocess_for_training(self, X_sensor: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Apply preprocessing and split for cascaded training.
        
        Returns:
            X_stage1: (N, 100, 3) preprocessed sensor data
            y_stage1: (N,) binary labels (0=Normal, 1=Hazard)
            y_stage2: (N_hazard,) binary labels for hazard samples (0=SpeedBreaker, 1=Pothole)
        """
        X_stage1 = []
        y_stage1 = []
        
        hazard_indices = []
        
        for i, segment in enumerate(X_sensor):
            processed = preprocess_accel(segment)
            if processed is not None:
                X_stage1.append(processed)
                label = y[i]
                y_stage1.append(0 if label == 0 else 1)  # 0=Normal, 1=Hazard
                if label > 0:
                    hazard_indices.append(len(X_stage1) - 1)
        
        X_stage1 = np.array(X_stage1)
        y_stage1 = np.array(y_stage1)
        
        # For Stage 2: only hazard samples
        X_hazard = X_stage1[hazard_indices]
        y_hazard_original = y[hazard_indices]
        y_stage2 = np.where(y_hazard_original == 1, 0, 1)  # 1=SpeedBreaker -> 0, 2=Pothole -> 1
        
        print(f"After preprocessing: {len(X_stage1)} valid segments")
        print(f"Stage 1 distribution: Normal={np.sum(y_stage1==0)}, Hazard={np.sum(y_stage1==1)}")
        print(f"Stage 2 distribution: SpeedBreaker={np.sum(y_stage2==0)}, Pothole={np.sum(y_stage2==1)}")
        
        return X_stage1, y_stage1, y_stage2


def get_train_val_split(X: np.ndarray, y: np.ndarray, test_size: float = 0.2, stratify: bool = True):
    """Get stratified train/validation split."""
    strat = y if stratify else None
    return train_test_split(X, y, test_size=test_size, stratify=strat, random_state=42)