"""Accelerometer preprocessing pipeline for hazard detection."""
import numpy as np
from typing import Optional


def preprocess_accel(raw: np.ndarray, w: int = 10, k: float = 2.5, fs: int = 50) -> Optional[np.ndarray]:
    """Preprocess tri-axial accelerometer data for hazard detection.

    Args:
        raw: Raw accelerometer array of shape (T, 3), where T=100
        w: Window size for SMA smoothing (default 10)
        k: Spike detection threshold multiplier (default 2.5)
        fs: Sampling frequency (default 50Hz)

    Returns:
        Preprocessed array of shape (100, 3) if spike detected, None otherwise

    Steps:
    1. Compute signal magnitude: mag = sqrt(ax² + ay² + az²) for each timestep
    2. Apply sliding window SMA smoothing with window size w
    3. Compute moving average mu of the full smoothed magnitude
    4. Spike detection: if max(smoothed_mag) <= k * mu → return None (no hazard)
    5. If spike detected: normalize each channel independently to zero mean, unit variance
    """
    # Validate input shape
    if raw.shape != (100, 3):
        raise ValueError(f"Expected shape (100, 3), got {raw.shape}")

    # Step 1: Compute signal magnitude
    mag = np.sqrt(np.sum(raw ** 2, axis=1))  # Shape: (100,)

    # Step 2: Apply sliding window SMA smoothing
    smoothed_mag = np.convolve(mag, np.ones(w)/w, mode='same')  # Shape: (100,)

    # Step 3: Compute moving average mu of the full smoothed magnitude
    mu = np.mean(smoothed_mag)

    # Step 4: Spike detection
    max_smoothed = np.max(smoothed_mag)
    if max_smoothed <= k * mu:
        return None  # No hazard detected, classify as Normal immediately

    # Step 5: Normalize each channel independently to zero mean, unit variance
    normalized = np.zeros_like(raw, dtype=np.float32)
    for axis in range(3):
        channel = raw[:, axis]
        mean_val = np.mean(channel)
        std_val = np.std(channel)
        if std_val > 0:  # Avoid division by zero
            normalized[:, axis] = (channel - mean_val) / std_val
        else:
            normalized[:, axis] = channel - mean_val  # If std=0, just center

    return normalized