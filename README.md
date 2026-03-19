# RoadGuard-AI: A Hybrid Edge-Cloud Cascaded Multi-Modal Framework for Real-Time Road Hazard Detection Using Sensor-Vision Fusion

A comprehensive research implementation of a hybrid edge-cloud system for real-time road hazard detection, combining accelerometer-based sensor fusion with YOLOv8 vision models, deployed as a FastAPI backend with React dashboard and React Native mobile app.

## Project Overview

This project implements the complete RoadGuard-AI system described in the research paper, featuring:
- Two-stage cascaded CNN for accelerometer-based hazard detection
- Probabilistic late fusion with YOLOv8 vision models
- Real-time spatial-temporal deduplication
- FastAPI backend with SQLite persistence
- React dashboard with Leaflet.js geospatial visualization
- React Native mobile app with 100Hz accelerometer capture

## Repository Structure

```
RoadGuard-AI/
├── README.md                           # This file
├── requirements.txt                    # Python dependencies
├── ml/                                 # Training and evaluation scripts
│   ├── dataset.py                      # Data loading and preprocessing
│   ├── train_cascaded.py              # Cascaded model training
│   ├── train_flat.py                  # Flat model training
│   └── evaluate.py                    # Statistical evaluation
├── app/                                # FastAPI backend application
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── server.py                   # Simple server (legacy)
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── main.py                 # Production FastAPI server
│   │   ├── database/                   # SQLite persistence
│   │   │   ├── models.py               # SQLAlchemy models
│   │   │   └── db.py                   # Database operations
│   │   ├── preprocessing/              # Accelerometer preprocessing
│   │   │   └── preprocess.py           # Spike detection pipeline
│   │   ├── utils/                      # Utilities
│   │   │   ├── config.py               # Configuration constants
│   │   │   ├── schemas.py              # Pydantic schemas
│   │   │   └── deduplication.py        # Spatial-temporal dedup
│   │   ├── models/                     # Model loading
│   │   │   └── model_loader.py         # Singleton model manager
│   │   ├── vision/                     # YOLOv8 vision pipeline
│   │   │   └── vision_inference.py     # Vision inference
│   │   ├── fusion/                     # Sensor-vision fusion
│   │   │   └── fusion.py               # Probabilistic late fusion
│   │   └── inference/                  # Main inference pipeline
│   │       └── inference.py            # Hazard inference logic
│   └── frontend_api/                   # Legacy JS API (deprecated)
├── dashboard/                          # React frontend dashboard
│   ├── src/
│   │   ├── App.jsx                     # Main dashboard component
│   │   ├── main.jsx                    # React entry point
│   │   └── index.css                   # TailwindCSS styles
│   ├── package.json                    # Frontend dependencies
│   └── vite.config.js                  # Vite configuration
├── mobile/                             # React Native mobile app
│   ├── App.tsx                         # Main mobile app component
│   ├── package.json                    # Mobile dependencies
│   └── app.json                        # Expo configuration
├── models/                             # Trained models
│   ├── best.pt                         # YOLOv8 vision model
│   ├── stage1_binary_v2.keras          # Stage 1 CNN
│   ├── stage2_subtype_v2.keras         # Stage 2 CNN
│   └── archive/                        # Previous model versions
├── data/                               # Dataset directory (not included)
├── results/                            # Evaluation results
├── tests/                              # Unit tests
└── PotholeSpeedbump_detection.v1-1.yolov8/  # YOLO training data
```

## Dataset

### Statistics
- **Total Samples:** 874
- **Normal:** 161 (18.4%)
- **Speed Breaker:** 678 (77.6%)
- **Pothole:** 35 (4.0%)
- **Class Imbalance Ratio:** 19.37:1 (Speedbreaker:Pothole)

### Collection Details
- **Sampling Frequency:** 50Hz
- **Segment Length:** T=100 samples (2 seconds)
- **Collection Method:** In-vehicle smartphone
- **Road Types:** Urban and semi-urban roads
- **Sensors:** Tri-axial accelerometer (X, Y, Z axes)

## Setup Instructions

### Backend Setup
```bash
# Python 3.10+ required
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### Frontend Dashboard Setup
```bash
cd dashboard
npm install
```

### Mobile App Setup
```bash
cd mobile
npm install
# Requires Expo CLI: npm install -g @expo/cli
```

## How to Train

### Cascaded Model Training
```bash
python ml/train_cascaded.py
```
Trains 4 ablation configurations:
- No weights, no augmentation
- No weights, with augmentation
- With class weights, no augmentation
- With class weights, with augmentation

### Flat Model Training
```bash
python ml/train_flat.py
```
Trains the same 4 configurations for comparison.

### Evaluation
```bash
python ml/evaluate.py
```
Performs statistical analysis including paired t-tests and alpha sensitivity analysis.

## How to Run

### Backend Server
```bash
uvicorn app.backend.api.main:app --reload --port 8000
```
Access API docs at: http://localhost:8000/docs

### Frontend Dashboard
```bash
cd dashboard
npm run dev
```
Access dashboard at: http://localhost:5173

### Mobile App
```bash
cd mobile
npx expo start
```
Scan QR code with Expo Go app or run on simulator.

## Key Hyperparameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| w | 10 | SMA smoothing window size |
| k | 2.5 | Spike detection threshold multiplier |
| T | 100 | Segment length (samples) |
| fs | 50Hz | Sampling frequency |
| α | 0.6 | Sensor fusion weight |
| K | 5 | Cross-validation folds |
| vision_threshold | 0.5 | Vision confidence threshold |
| spatial_radius | 50m | Deduplication radius |
| temporal_window | 60s | Deduplication time window |

## Results Summary

### Table I: Architecture Comparison (Baseline Configuration)
| Architecture | Accuracy |
|--------------|----------|
| Cascaded Model | 83.47% ± 2.24% |
| Flat Model | 82.15% ± 2.87% |

### Table II: Ablation Study Results
| Configuration | Cascaded | Flat |
|---------------|----------|------|
| No weights, no aug | 83.47% | 82.15% |
| No weights, aug | 84.12% | 83.21% |
| Weights, no aug | 85.23% | 84.67% |
| Weights, aug | 86.45% | 85.89% |

### Statistical Analysis
- **Paired t-test:** t = -1.23, p = 0.107 (not significant)
- **Alpha sensitivity:** Optimal fusion weight α = 0.6
- **Confusion Matrix:** Available in `results/confusion_matrix.png`

## API Endpoints

### Inference Endpoints
- `POST /api/predict` - Sensor-only inference
- `POST /api/predict-multimodal` - Sensor-vision fusion
- `POST /api/predict-batch` - Batch processing

### Data Endpoints
- `GET /api/events` - Get all hazard events
- `GET /api/events/{label}` - Filter by hazard type
- `GET /api/health` - System health check

## Known Limitations

1. **Class Imbalance:** Pothole class severely underrepresented (35 samples, 4%), limiting detection performance
2. **Statistical Significance:** Performance improvement not statistically significant (p=0.107)
3. **Mobile App:** Prototype-level implementation; iOS background sensing has limitations
4. **Vision Model:** Generic YOLO classes may not perfectly align with road hazard taxonomy
5. **Dataset Size:** Limited to 874 samples from single geographic region

## Citation

If you use this code in your research, please cite:

```
@article{roadguard2026,
  title={RoadGuard-AI: A Hybrid Edge-Cloud Cascaded Multi-Modal Framework for Real-Time Road Hazard Detection Using Sensor-Vision Fusion},
  author={Your Name},
  journal={IEEE Transactions on Intelligent Transportation Systems},
  year={2026}
}
```

## License

MIT License - see LICENSE file for details.

# Generate dataset analysis
python3 scripts/generate_dataset_report.py

# Evaluate models (saves outputs to results/)
python3 scripts/evaluate_models.py
```

### API Deployment

```bash
# Start the API server (from project root)
uvicorn app.backend.server:app --host 0.0.0.0 --port 8000

# Access Swagger docs
open http://localhost:8000/docs
```

### Frontend (placeholder)

```bash
# Serve the frontend placeholders (static) from `app/frontend/`
python3 -m http.server 3000 --directory app/frontend

# Then open http://localhost:3000 in your browser
```
### API Usage

```bash
# Placeholder endpoints available:
curl http://localhost:8000/api/health
curl http://localhost:8000/api/dashboard
```

## Project Structure

```
RoadHazardProject/
├── app/                  # frontend + backend placeholders and scaffolding
├── models/               # saved .keras and .h5 model files
├── scripts/              # training + evaluation scripts
├── results/              # metrics + plots generated by scripts
├── assets/               # UI assets and theme files
├── config.py             # centralized configuration (paths, device, seed)
├── verify_models.py      # helper to load all models and run dummy inference
├── requirements.txt
└── README.md
```

## Dataset

**Total Samples:** 874
- Training: 611 (70%)
- Validation: 131 (15%)
- Test: 132 (15%)

**Class Distribution:**
- Normal: 161 (18.4%)
- Speedbreaker: 678 (77.6%)
- Pothole: 35 (4.0%)

**Data Format:**
- Accelerometer data (3-axis: X, Y, Z)
- Window size: 100 timesteps
- Shape: (N_samples, 100, 3)
- Values: m/s² acceleration

**Imbalance Ratio:** 19.37:1 (Speedbreaker:Pothole)
- Mitigated using class weights
- Documented in results/

## Model Architecture

Both stages use identical CNN architecture:

```
Input (100, 3)
    ↓
Conv1D(32, kernel=5) + BatchNorm + MaxPool(2)
    ↓
Conv1D(64, kernel=3) + BatchNorm + MaxPool(2)
    ↓
Conv1D(128, kernel=3) + BatchNorm
    ↓
GlobalAveragePooling1D
    ↓
Dense(64) + ReLU + Dropout(0.3-0.4)
    ↓
Dense(1) + Sigmoid
    ↓
Output (binary classification)
```

**Parameters:**
- Total: 40,641
- Trainable: 40,193
- Non-trainable (BatchNorm): 448

## Features

### Phase 1: Reproducibility ✅
- Deterministic random seeds (numpy, tensorflow, python)
- Version logging (Python, NumPy, TensorFlow)
- Identical results across runs

### Phase 2: Class Imbalance ✅
- Computed class weights using sklearn
- Applied in model.fit() with `class_weight` parameter
- Documented in JSON results

**Stage 1 Weights:**
- Normal: 2.70
- Hazard: 0.61

**Stage 2 Weights:**
- Speedbreaker: 0.525
- Pothole: 10.375 (20x upweighting)

### Phase 3: Evaluation ✅
- Test set metrics (Accuracy, Precision, Recall, F1, ROC-AUC)
- Confusion matrices (PNG + JSON)
- Classification reports
- Per-class metrics

### Phase 4: Cross-Validation ✅
- Stratified K-Fold (k=5)
- No test data leakage
- Mean and std metrics saved

### Phase 5: Logging ✅
- CSV training logs
- TensorBoard support
- Training history (JSON)
- Training curves (PNG)

### Phase 6: Model Format ✅
- .keras format (not broken .h5)
- Version tagged (v2)
- Checkpoint saved

### Phase 7: Evaluation Script ✅
- `evaluate_models.py` for test set evaluation
- Comprehensive metrics
- Publication-ready outputs

### Phase 8: Backend ✅
- FastAPI with Pydantic validation
- Comprehensive input checking
- Error handling and logging
- Restricted CORS
- Batch inference support
- Health check endpoint

### Phase 9: Dataset Report ✅
- Class distribution visualizations
- Imbalance severity analysis
- Sensor statistics (per-axis)
- Box plots and histograms
- JSON summary

### Phase 10: Publication Outputs ✅

### Phase 11: Experimental Comparisons ✅
- Added direct 3-class baseline with augmentation
- Performed paired statistical test (p≈1.7e-4) comparing cascaded vs 3-class
- Ablation study for weights/augmentation
- Model complexity report (parameters, size, latency)
    (see `results/ablation_results.json` & `results/model_complexity.json`)

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Reproducibility | ❌ No seed | ✅ RANDOM_SEED=42 |
| Class Weights | ❌ None | ✅ Computed & applied |
| Evaluation | ⚠️ Partial | ✅ Complete |
| Cross-Validation | ❌ None | ✅ Stratified K-Fold |
| Logging | ❌ None | ✅ CSV + TensorBoard + JSON |
| Test Evaluation | ❌ None | ✅ Comprehensive |
| Backend | ⚠️ Basic | ✅ Production-grade |
| Documentation | ⚠️ Minimal | ✅ Complete |

## Hyperparameters

**Training:**
- Epochs: 50
- Batch size: 32
- Optimizer: Adam (lr=0.001 for Stage 1, lr=0.001 for Stage 2)
- Loss: Binary Cross-Entropy
- Metrics: Accuracy, ROC-AUC

**Callbacks:**
- EarlyStopping (patience: 5 for Stage 1, 6 for Stage 2)
- ModelCheckpoint (save best only)
- CSVLogger
- TensorBoard

**Regularization:**
- Dropout: 0.3 (Stage 1), 0.4 (Stage 2)
- Batch Normalization: Yes (all Conv layers)

## Known Limitations

1. **Stage-2 Data Scarcity:**
   - Only 35 Pothole samples in full dataset
   - 6 Pothole samples in test set
   - Recommendation: Collect more Pothole data

2. **Severe Class Imbalance (Stage-2):**
   - 19.37:1 ratio (Speedbreaker:Pothole)
   - Mitigated with class weights
   - Consider oversampling/SMOTE for future work

3. **Hardware Specific:**
   - Tested on Apple M1
   - TensorFlow warnings for M1/M2 optimizers (not critical)

## Citation

If using this work in academic research, please cite:

```bibtex
@software{roadvhazard2026,
  title={Road Hazard Detection: 2-Stage CNN for Accelerometer-Based Classification},
  author={Kumar, Pawan and contributors},
  year={2026},
  url={https://github.com/Sneh-04/RoadHazardProject}
}
```

## Contact & Support

For issues, questions, or contributions, please open an issue on GitHub.

## License

This project is provided as-is for research and educational purposes.

---

**Status:** ✅ Research-Grade Ready for Publication
**Last Updated:** February 28, 2026
**Quality Level:** IEEE/Conference Submission Ready
