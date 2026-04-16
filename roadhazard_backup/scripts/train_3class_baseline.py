import os
import json
import numpy as np
import tensorflow as tf
from sklearn.model_selection import StratifiedKFold
from sklearn.utils.class_weight import compute_class_weight

# ensure local scripts directory is on path for imports
import sys, os
sys.path.append(os.path.dirname(__file__))
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, CSVLogger, TensorBoard

# reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
import random
random.seed(RANDOM_SEED)

tf.random.set_seed(RANDOM_SEED)

# augmentation utilities
# augmentation utilities
from augmentation import augment_batch

# load data
data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed_accel_only_fixed')
X_train = np.load(os.path.join(data_dir, 'X_train.npy'))
y_train = np.load(os.path.join(data_dir, 'y_train.npy'))
X_val = np.load(os.path.join(data_dir, 'X_val.npy'))
y_val = np.load(os.path.join(data_dir, 'y_val.npy'))
X_test = np.load(os.path.join(data_dir, 'X_test.npy'))
y_test = np.load(os.path.join(data_dir, 'y_test.npy'))

# convert to 3-class labels: 0 normal, 1 speedbreaker, 2 pothole
y_train_3 = y_train.copy()
y_val_3 = y_val.copy()
y_test_3 = y_test.copy()

# compute class weights
total_classes = np.unique(y_train_3)
class_weights = compute_class_weight(class_weight='balanced', classes=total_classes, y=y_train_3)
class_weights = {int(i): w for i, w in enumerate(class_weights)}
print("3-class class weights", class_weights)

# model

def create_3class_model():
    inputs = tf.keras.Input(shape=(100, 3))
    x = tf.keras.layers.Conv1D(32, 5, activation='relu')(inputs)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPool1D(2)(x)
    x = tf.keras.layers.Conv1D(64, 3, activation='relu')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPool1D(2)(x)
    x = tf.keras.layers.Conv1D(128, 3, activation='relu')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    x = tf.keras.layers.Dense(64, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(3, activation='softmax')(x)
    model = tf.keras.Model(inputs, outputs)
    return model

# stratified k-fold
kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

cv_results = []
fold = 0
for train_index, val_index in kf.split(X_train, y_train_3):
    fold += 1
    X_tr, X_va = X_train[train_index], X_train[val_index]
    y_tr, y_va = y_train_3[train_index], y_train_3[val_index]

    # apply augmentation to training fold
    X_tr_aug = augment_batch(X_tr)

    model = create_3class_model()
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    # use centralized project directories
    base_dir = os.path.dirname(__file__)
    from config import MODEL_DIR as model_dir, RESULTS_DIR as result_dir
    log_dir = os.path.normpath(os.path.join(base_dir, '..', 'logs'))

    os.makedirs(result_dir, exist_ok=True)
    os.makedirs(log_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)

    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True),
        ModelCheckpoint(os.path.join(result_dir, f"3class_fold{fold}.keras"), save_best_only=True),
        CSVLogger(os.path.join(log_dir, f"3class_fold{fold}.csv")),
        TensorBoard(log_dir=os.path.join(log_dir, f"3class_fold{fold}_tb"))
    ]

    model.fit(X_tr_aug, y_tr, validation_data=(X_va, y_va),
              epochs=50, batch_size=32, class_weight=class_weights,
              callbacks=callbacks)

    scores = model.evaluate(X_va, y_va, verbose=0)
    cv_results.append(scores[1])

# base_dir defined above; result_dir already set via config
# save cv results
with open(os.path.join(result_dir, '3class_cv_results.json'), 'w') as f:
    json.dump({'cv_accuracy': cv_results, 'mean': np.mean(cv_results), 'std': np.std(cv_results)}, f)

# final evaluation on test set using model trained on full training data
final_model = create_3class_model()
final_model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
final_model.fit(augment_batch(X_train), y_train_3, validation_data=(X_val, y_val_3),
                epochs=50, batch_size=32, class_weight=class_weights,
                callbacks=[EarlyStopping(patience=5, restore_best_weights=True)])

# final evaluation on test set using model trained on full training data
model_path = os.path.join(model_dir, '3class_baseline.keras')
final_model.save(model_path)

# test evaluation
preds = final_model.predict(X_test)
pred_labels = np.argmax(preds, axis=1)

from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
acc = accuracy_score(y_test_3, pred_labels)
report = classification_report(y_test_3, pred_labels, output_dict=True)
cm = confusion_matrix(y_test_3, pred_labels)

with open(os.path.join(result_dir, '3class_test_metrics.json'), 'w') as f:
    json.dump({'accuracy': acc, 'report': report, 'confusion_matrix': cm.tolist()}, f)

print("3-class test accuracy", acc)
print(cm)
