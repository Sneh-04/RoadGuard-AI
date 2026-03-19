import os
import platform
import multiprocessing

try:
    import tensorflow as tf
except Exception:
    tf = None

ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(ROOT, "models")
RESULTS_DIR = os.path.join(ROOT, "results")
ASSETS_DIR = os.path.join(ROOT, "assets")

RANDOM_SEED = int(os.environ.get("RH_RANDOM_SEED", 42))

def detect_device():
    if tf is None:
        return "cpu"
    try:
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            return "gpu"
        devices = tf.config.list_physical_devices()
        for d in devices:
            if 'Apple' in d.device_type or 'GPU' in d.device_type:
                return "gpu"
    except Exception:
        pass
    return "cpu"

DEVICE = os.environ.get("RH_DEVICE", detect_device())

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)
