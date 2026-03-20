import os
import json
import numpy as np
import random
import tensorflow as tf
from sklearn.model_selection import StratifiedKFold
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import accuracy_score

# reproducibility
RANDOM_SEED = 42
os.environ['PYTHONHASHSEED'] = str(RANDOM_SEED)
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)

from augmentation import augment_batch

# data
base = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed_accel_only_fixed')
X = np.load(os.path.join(base, 'X_train.npy'))
y = np.load(os.path.join(base, 'y_train.npy'))

# model builders (same as compare script)
def build_stage1():
    inp = tf.keras.Input(shape=(100,3))
    x = tf.keras.layers.Conv1D(32,5,activation='relu')(inp)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPool1D(2)(x)
    x = tf.keras.layers.Conv1D(64,3,activation='relu')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPool1D(2)(x)
    x = tf.keras.layers.Conv1D(128,3,activation='relu')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    x = tf.keras.layers.Dense(64,activation='relu')(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(1,activation='sigmoid')(x)
    m = tf.keras.Model(inp,out)
    m.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return m

def build_stage2():
    inp = tf.keras.Input(shape=(100,3))
    x = tf.keras.layers.Conv1D(32,5,activation='relu')(inp)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPool1D(2)(x)
    x = tf.keras.layers.Conv1D(64,3,activation='relu')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPool1D(2)(x)
    x = tf.keras.layers.Conv1D(128,3,activation='relu')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    x = tf.keras.layers.Dense(64,activation='relu')(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    out = tf.keras.layers.Dense(1,activation='sigmoid')(x)
    m = tf.keras.Model(inp,out)
    m.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return m

def build_3class():
    inp = tf.keras.Input(shape=(100,3))
    x = tf.keras.layers.Conv1D(32,5,activation='relu')(inp)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPool1D(2)(x)
    x = tf.keras.layers.Conv1D(64,3,activation='relu')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPool1D(2)(x)
    x = tf.keras.layers.Conv1D(128,3,activation='relu')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    x = tf.keras.layers.Dense(64,activation='relu')(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(3,activation='softmax')(x)
    m = tf.keras.Model(inp,out)
    m.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return m

results = []

for use_weights in [False, True]:
    for use_aug in [False, True]:
        # cross-val cascaded
        casc_acc = []
        kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
        for train_idx, val_idx in kf.split(X, y):
            X_tr, X_val = X[train_idx], X[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]

            # stage1 labels: CORRECT MAPPING (y > 0) not (y != 1)
            lab1_tr = (y_tr > 0).astype(int)
            lab1_val = (y_val > 0).astype(int)
            st1 = build_stage1()
            if use_weights:
                w1 = compute_class_weight('balanced', classes=np.unique(lab1_tr), y=lab1_tr)
                w1 = {i:w1[i] for i in range(len(w1))}
            else:
                w1 = None
            tr_data = augment_batch(X_tr) if use_aug else X_tr
            st1.fit(tr_data, lab1_tr, epochs=10, batch_size=32, class_weight=w1, verbose=0)
            pred1 = (st1.predict(X_val)>0.5).astype(int).flatten()

            # stage2 train on hazard samples
            mask = lab1_tr==1
            X_tr_hz = X_tr[mask]
            y_tr_hz = (y_tr[mask]==2).astype(int)
            st2 = build_stage2()
            if use_weights:
                w2 = compute_class_weight('balanced', classes=np.unique(y_tr_hz), y=y_tr_hz)
                w2 = {i:w2[i] for i in range(len(w2))}
            else:
                w2 = None
            tr2_data = augment_batch(X_tr_hz) if use_aug else X_tr_hz
            st2.fit(tr2_data, y_tr_hz, epochs=10, batch_size=32, class_weight=w2, verbose=0)

            final = np.zeros_like(y_val)
            for i, p in enumerate(pred1):
                if p == 0:
                    final[i] = 0
                else:
                    sub = st2.predict(X_val[i:i+1])
                    final[i] = 2 if sub>0.5 else 1
            casc_acc.append(accuracy_score(y_val, final))

        # cross-val 3-class
        three_acc = []
        for train_idx, val_idx in kf.split(X, y):
            X_tr, X_val = X[train_idx], X[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]
            m3 = build_3class()
            if use_weights:
                w3 = compute_class_weight('balanced', classes=np.unique(y_tr), y=y_tr)
                w3 = {i:w3[i] for i in range(len(w3))}
            else:
                w3 = None
            tr_data = augment_batch(X_tr) if use_aug else X_tr
            m3.fit(tr_data, y_tr, epochs=10, batch_size=32, class_weight=w3, verbose=0)
            pred3 = np.argmax(m3.predict(X_val), axis=1)
            three_acc.append(accuracy_score(y_val, pred3))

        results.append({
            'use_weights': use_weights,
            'use_aug': use_aug,
            'cascaded_cv': casc_acc,
            'three_cv': three_acc,
            'cascaded_mean': np.mean(casc_acc),
            'three_mean': np.mean(three_acc)
        })

outpath = os.path.join(os.path.dirname(__file__), '..', 'results', 'ablation_results.json')
with open(outpath,'w') as f:
    json.dump(results, f, indent=2)
print(f"Ablation study results saved to {outpath}")
