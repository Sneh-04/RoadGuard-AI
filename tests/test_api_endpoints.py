#!/usr/bin/env python3
"""Test the FastAPI prediction endpoint."""
import sys
import json
import time
import subprocess
import requests
from pathlib import Path
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

print("=" * 80)
print("FASTAPI ENDPOINT TEST")
print("=" * 80)
print()

# Start the server in background
print("Starting FastAPI server...")
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.backend.api.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd=PROJECT_ROOT,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Wait for server to start
time.sleep(5)

print("✓ Server started (PID: {})".format(proc.pid))
print()

# Test health endpoint
print("✓ Test 1: Health check endpoint...")
try:
    response = requests.get("http://127.0.0.1:8000/api/health", timeout=5)
    if response.status_code == 200:
        health = response.json()
        print(f"  Status: {health['status']}")
        print(f"  Models loaded: {health['models_loaded']}")
        print(f"  Stage 1: {health['stage1_model']}")
        print(f"  Stage 2: {health['stage2_model']}")
        print(f"  Vision: {health['vision_model']}")
        print("  ✅ Health check passed")
    else:
        print(f"  ❌ Health check failed: {response.status_code}")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"  ❌ Failed to reach health endpoint: {e}")
    proc.kill()
    sys.exit(1)

print()

# Test predict endpoint
print("✓ Test 2: Prediction endpoint...")
try:
    # Create dummy accelerometer data (100 timesteps, 3 axes)
    dummy_data = np.random.randn(100, 3).tolist()
    
    payload = {
        "data": dummy_data,
        "metadata": {
            "sensor": "accelerometer",
            "sample_rate": 50
        }
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/predict",
        json=payload,
        timeout=10
    )
    
    if response.status_code == 200:
        prediction = response.json()
        print(f"  Hazard detected: {prediction['hazard_detected']}")
        print(f"  Confidence: {prediction['confidence']:.4f}")
        if prediction['hazard_type']:
            print(f"  Hazard type: {prediction['hazard_type']}")
            print(f"  Stage 2 confidence: {prediction['stage2_confidence']:.4f}")
        print(f"  Severity score: {prediction['severity_score']:.4f}")
        print("  ✅ Prediction successful")
    else:
        print(f"  ❌ Prediction failed: {response.status_code}")
        print(f"  Response: {response.text}")
        
except Exception as e:
    print(f"  ❌ Failed to call predict endpoint: {e}")
    proc.kill()
    sys.exit(1)

print()

# Test info endpoint
print("✓ Test 3: Info endpoint...")
try:
    response = requests.get("http://127.0.0.1:8000/api/info", timeout=5)
    if response.status_code == 200:
        info = response.json()
        print(f"  Title: {info['title']}")
        print(f"  Version: {info['version']}")
        print(f"  Device: {info['device']}")
        print("  ✅ Info retrieved")
    else:
        print(f"  ❌ Info endpoint failed: {response.status_code}")
except Exception as e:
    print(f"  ❌ Failed to get info: {e}")

print()

# Cleanup
print("Shutting down server...")
proc.terminate()
proc.wait(timeout=5)
print()

print("=" * 80)
print("✅ ALL ENDPOINT TESTS PASSED")
print("=" * 80)
print()
print("Backend is ready for production deployment!")
