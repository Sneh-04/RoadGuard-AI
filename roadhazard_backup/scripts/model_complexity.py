import os
import time
import numpy as np
import tensorflow as tf

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

models = [
    ('stage1_binary_v2.keras', 'Stage1'),
    ('stage2_subtype_v2.keras', 'Stage2'),
    ('3class_baseline.keras', '3Class')
]

report = {}
for fname, label in models:
    path = os.path.join(MODEL_DIR, fname)
    if not os.path.exists(path):
        continue
    m = tf.keras.models.load_model(path, compile=False)
    params = m.count_params()
    size = os.path.getsize(path)
    # measure inference time
    dummy = np.zeros((100,100,3), dtype=np.float32)
    start = time.time()
    _ = m.predict(dummy, batch_size=32, verbose=0)
    elapsed = time.time() - start
    time_per_sample = elapsed / dummy.shape[0]

    # attempt FLOPs using TF profiler if available
    try:
        # use tf.profiler.experimental
        logdir = '/tmp/tfprof'
        tf.profiler.experimental.start(logdir)
        _ = m(dummy)
        tf.profiler.experimental.stop()
        flops = 'see profiler logs'
    except Exception:
        flops = None

    report[label] = {
        'parameters': params,
        'size_bytes': size,
        'inference_time_per_sample': time_per_sample,
        'flops': flops
    }

outpath = os.path.join(os.path.dirname(__file__), '..', 'results', 'model_complexity.json')
with open(outpath, 'w') as f:
    import json
    json.dump(report, f, indent=2)
print(f"Model complexity report saved to {outpath}")
