"""Load all .keras models in models/ and run a dummy inference.
Raises an exception if any model fails to load or run.
"""
import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.models import model_from_json
import h5py
import json

from config import MODEL_DIR


def find_models(directory):
    out = []
    for root, _, files in os.walk(directory):
        for f in files:
            if f.endswith('.keras') or f.endswith('.h5'):
                out.append(os.path.join(root, f))
    return sorted(out)


def run_dummy_inference(model_path):
    try:
        m = load_model(model_path, compile=False)
    except TypeError:
        # Retry with a patched InputLayer that ignores unsupported kwargs
        try:
            from tensorflow.keras.layers import InputLayer as KInputLayer
            try:
                from tensorflow.keras.mixed_precision import Policy as KerasPolicy
            except Exception:
                KerasPolicy = None

            class PatchedInputLayer(KInputLayer):
                def __init__(self, *args, **kwargs):
                    kwargs.pop("batch_shape", None)
                    kwargs.pop("optional", None)
                    super().__init__(*args, **kwargs)

            custom_objs = {"InputLayer": PatchedInputLayer}
            if KerasPolicy is not None:
                custom_objs["DTypePolicy"] = KerasPolicy

            m = load_model(model_path, compile=False, custom_objects=custom_objs)
        except Exception:
            # If it's an H5 file, attempt legacy conversion: extract model_config and weights
            if model_path.endswith('.h5'):
                try:
                    with h5py.File(model_path, 'r') as f:
                        # model config may be stored in attributes
                        if 'model_config' in f.attrs:
                            model_json = f.attrs['model_config']
                            if isinstance(model_json, bytes):
                                model_json = model_json.decode('utf-8')
                        elif 'model_config' in f:
                            model_json = f['model_config'][()]
                            if isinstance(model_json, bytes):
                                model_json = model_json.decode('utf-8')
                        else:
                            model_json = None

                    if model_json:
                        model = model_from_json(model_json)
                        # load weights from the H5 file
                        model.load_weights(model_path)
                        # save as .keras for future use
                        new_path = os.path.splitext(model_path)[0] + '.keras'
                        model.save(new_path)
                        print(f"Converted {model_path} -> {new_path}")
                        m = model
                    else:
                        raise
                except Exception:
                    raise
            else:
                raise
    # try to infer input shape
    try:
        input_shape = m.input_shape
    except Exception:
        # Some models expose inputs differently
        input_shape = None
    if isinstance(input_shape, list):
        input_shape = input_shape[0]
    if input_shape is None:
        # fallback: attempt a (1, 100, 3) dummy
        x = np.random.uniform(size=(1, 100, 3)).astype(np.float32)
    else:
        # remove batch dim
        shape = tuple([s if s is not None else 1 for s in input_shape[1:]])
        x = np.random.uniform(size=(1,)+shape).astype(np.float32)
    out = m.predict(x)
    print(f"Loaded: {os.path.basename(model_path)} -> output shape: {np.array(out).shape}")


def main():
    models = find_models(MODEL_DIR)
    if not models:
        print(f"No .keras or .h5 models found in {MODEL_DIR}")
        sys.exit(2)

    failures = []
    for mp in models:
        try:
            run_dummy_inference(mp)
        except Exception as e:
            print(f"ERROR loading {mp}: \n{e}")
            failures.append({'path': mp, 'error': str(e)})

    if failures:
        print('\nSummary: Some models failed to load:')
        for f in failures:
            print(f" - {f['path']}: {f['error'][:200]}")
        sys.exit(1)
    else:
        print('\nAll models loaded and ran inference successfully.')


if __name__ == '__main__':
    main()
