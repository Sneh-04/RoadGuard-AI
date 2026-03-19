import os
import json
import numpy as np
import random
import tensorflow as tf
from sklearn.model_selection import StratifiedKFold
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import accuracy_score
from scipy.stats import ttest_rel

# reproducibility
RANDOM_SEED = 42
os.environ['PYTHONHASHSEED'] = str(RANDOM_SEED)
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)

# paths
data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed_accel_only_fixed')

# load data
X = np.load(os.path.join(data_dir, 'X_train.npy'))
y = np.load(os.path.join(data_dir, 'y_train.npy'))

# model builders

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

# prepare labels for stage1 and stage2
# CORRECT MAPPING: normal (0) vs hazard (1 or 2)
labels_stage1 = (y > 0).astype(int)  # normal=0, hazard=1 (speedbreaker or pothole)
labels_stage2 = y.copy()
labels_stage2 = labels_stage2[labels_stage1==1]
labels_stage2 = (labels_stage2==2).astype(int)  # pothole=1 speedbreaker=0

kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

cascaded_acc = []
three_acc = []

fold = 0
for train_idx, val_idx in kf.split(X, y):
    fold += 1
    print(f"Fold {fold}")
    X_tr, X_val = X[train_idx], X[val_idx]
    y_tr, y_val = y[train_idx], y[val_idx]

    # train stage1
    st1 = build_stage1()
    w1 = compute_class_weight('balanced', classes=np.unique(labels_stage1[train_idx]), y=labels_stage1[train_idx])
    st1.fit(X_tr, labels_stage1[train_idx], epochs=10, batch_size=32, class_weight={i:w1[i] for i in range(len(w1))}, verbose=0)

    # predict val stage1
    pred1 = (st1.predict(X_val) > 0.5).astype(int).flatten()

    # prepare data for stage2 training: only hazard subset within train
    mask_tr = labels_stage1[train_idx]==1
    X_tr_hz = X_tr[mask_tr]
    y_tr_hz = (y_tr[mask_tr]==2).astype(int)
    st2 = build_stage2()
    w2 = compute_class_weight('balanced', classes=np.unique(y_tr_hz), y=y_tr_hz)
    st2.fit(X_tr_hz, y_tr_hz, epochs=10, batch_size=32, class_weight={i:w2[i] for i in range(len(w2))}, verbose=0)

    # apply cascade to val
    final_preds = np.zeros_like(y_val)
    for i, p in enumerate(pred1):
        if p == 0:
            final_preds[i] = 1  # normal label is 1? Actually original y: normal=0, speed=1, pothole=2.
            # choose 0
            final_preds[i] = 0
        else:
            sub = st2.predict(X_val[i:i+1])
            final_preds[i] = 2 if sub>0.5 else 1
    acc = accuracy_score(y_val, final_preds)
    cascaded_acc.append(acc)

    # also compute 3-class on this fold to get corresponding result
    model3 = build_3class()
    w3 = compute_class_weight('balanced', classes=np.unique(y_tr), y=y_tr)
    model3.fit(X_tr, y_tr, epochs=10, batch_size=32, class_weight={i:w3[i] for i in range(len(w3))}, verbose=0)
    pred3 = np.argmax(model3.predict(X_val), axis=1)
    acc3 = accuracy_score(y_val, pred3)
    three_acc.append(acc3)

print("Cascaded fold accuracies", cascaded_acc)
print("3-class fold accuracies", three_acc)

# paired t-test
stat, p = ttest_rel(cascaded_acc, three_acc)
print(f"Paired t-test p-value: {p}")
if p < 0.05:
    print("Difference is statistically significant (p<0.05)")
else:
    print("No significant difference (p>=0.05)")

with open('../results/cv_comparison.json','w') as f:
    json.dump({'cascaded': cascaded_acc, 'three': three_acc, 'p_value': p}, f)
