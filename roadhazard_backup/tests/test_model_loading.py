#!/usr/bin/env python3
"""Test script to verify model loading works correctly."""
import sys
import os
from pathlib import Path

# Add project to path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # Suppress TF warnings

print("=" * 80)
print("MODEL LOADING TEST")
print("=" * 80)
print()

# Test 1: Import config
print("✓ Test 1: Import configuration...")
try:
    from app.backend.utils.config import (
        STAGE1_MODEL_PATH,
        STAGE2_MODEL_PATH,
    )
    print(f"  STAGE1: {STAGE1_MODEL_PATH}")
    print(f"  STAGE2: {STAGE2_MODEL_PATH}")
    print("  ✅ Config loaded successfully")
except Exception as e:
    print(f"  ❌ Failed to load config: {e}")
    sys.exit(1)

print()

# Test 2: Check file existence
print("✓ Test 2: Check model file existence...")
models = {
    "STAGE1": STAGE1_MODEL_PATH,
    "STAGE2": STAGE2_MODEL_PATH,
}

all_exist = True
for name, path in models.items():
    if os.path.exists(path):
        size_mb = os.path.getsize(path) / (1024 * 1024)
        print(f"  ✅ {name}: {size_mb:.2f} MB")
    else:
        print(f"  ❌ {name}: NOT FOUND at {path}")
        all_exist = False

if not all_exist:
    print("\n  ⚠️  Some model files are missing!")
    sys.exit(1)

print()

# Test 3: Load models with Keras
print("✓ Test 3: Load models with TensorFlow/Keras...")
try:
    import tensorflow as tf
    from tensorflow import keras
    
    print("  Loading STAGE1...")
    stage1 = keras.models.load_model(STAGE1_MODEL_PATH)
    print(f"    ✅ Stage 1 loaded (input shape: {stage1.input_shape})")
    
    print("  Loading STAGE2...")
    stage2 = keras.models.load_model(STAGE2_MODEL_PATH)
    print(f"    ✅ Stage 2 loaded (input shape: {stage2.input_shape})")
    
    print("  Loading BASELINE...")
    baseline = keras.models.load_model(BASELINE_MODEL_PATH)
    print(f"    ✅ Baseline loaded (input shape: {baseline.input_shape})")
    
except Exception as e:
    print(f"  ❌ Model loading failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# Test 4: Run dummy inference
print("✓ Test 4: Run dummy inference...")
try:
    import numpy as np
    
    # Create dummy input (100 timesteps, 3 axes)
    dummy_input = np.random.randn(1, 100, 3).astype(np.float32)
    
    print("  Stage 1 inference...", end=" ")
    stage1_pred = stage1.predict(dummy_input, verbose=0)
    print(f"✅ Output: {float(stage1_pred[0][0]):.4f}")
    
    print("  Stage 2 inference...", end=" ")
    stage2_pred = stage2.predict(dummy_input, verbose=0)
    print(f"✅ Output: {float(stage2_pred[0][0]):.4f}")
    
    print("  Baseline inference...", end=" ")
    baseline_pred = baseline.predict(dummy_input, verbose=0)
    print(f"✅ Output: {np.argmax(baseline_pred[0])}")
    
except Exception as e:
    print(f"\n  ❌ Inference failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()

# Test 5: Test ModelLoader class
print("✓ Test 5: Test ModelLoader singleton...")
try:
    from app.backend.model_loader import get_model_loader
    
    loader = get_model_loader()
    print("  Loading all models via ModelLoader...")
    status = loader.load_all_models()
    
    if loader.is_ready():
        print("  ✅ All models loaded successfully")
        print(f"     Status: {status}")
    else:
        print("  ❌ Models not ready")
        print(f"     Status: {status}")
        sys.exit(1)
        
except Exception as e:
    print(f"  ❌ ModelLoader test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()
print("=" * 80)
print("✅ ALL TESTS PASSED")
print("=" * 80)
print()
print("Summary:")
print("  • Configuration imports correctly")
print("  • All model files exist and accessible")
print("  • Models load successfully with TensorFlow/Keras")
print("  • Inference runs without errors")
print("  • ModelLoader singleton works correctly")
print()
print("Backend is ready for deployment!")
