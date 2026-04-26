# 🗂️ RoadGuard - Complete File Structure & Reference

## 📁 Full Directory Tree with Descriptions

```
RoadGuard_Final/
│
├── 📚 DOCUMENTATION (15+ files)
│   ├── README.md                      → Main overview
│   ├── PROJECT_OVERVIEW.md            → System architecture (900+ lines)
│   ├── PROJECT_ANALYSIS.md            → This detailed analysis (NEW)
│   ├── QUICK_START.md                 → Get started in 5 minutes
│   ├── DEMO.md                        → Demo script
│   ├── DEMO_CHECKLIST.md              → Pre-demo verification
│   ├── TABLE_OF_CONTENTS.md           → Navigation guide
│   ├── COMPLETION_SUMMARY.md          → What was delivered
│   ├── PRODUCTION_READY.md            → Deployment status
│   ├── DELIVERY_CHECKLIST.md          → Delivery verification
│   ├── FIXES_SUMMARY.md               → All issues fixed
│   ├── CHANGES_SUMMARY.md             → Change log
│   ├── STRESS_TEST_REPORT.md          → Performance testing
│   ├── DEPLOYMENT_GUIDE.md            → Production deployment
│   ├── TESTING_GUIDE.md               → Testing procedures
│   ├── DOCUMENTATION_INDEX.md         → Doc index
│   ├── FIXED_CODE_REFERENCE.md        → Code fixes reference
│   ├── INDEX.md                       → Quick index
│   ├── ALIGNMENT_GUIDE.md             → Alignment guide
│   ├── PRODUCTION_CHANGES.md          → Production changes
│   ├── FRONTEND_FIX_REPORT.md         → Frontend fixes
│   ├── DEMO_QUICK_START.md            → Quick demo start
│   ├── DEMO_READY.md                  → Demo readiness
│   ├── DEMO_SCRIPT.md                 → Demo script
│   ├── UPGRADE_SUMMARY.md             → Upgrade info
│   ├── RESULTS_SUMMARY.md             → Results summary
│   ├── QUICKSTART.md                  → Alternative quick start
│   ├── README_ADMIN.md                → Admin documentation
│   ├── QUICK_START.sh                 → Bash startup script
│   └── Code Citations.litcoffee       → Code attribution
│
├── 🔧 ROOT CONFIGURATION
│   ├── config.py                      → Root configuration
│   ├── start.py                       → Root entry point
│   ├── test_api.py                    → API testing script
│   ├── test_production_api.py         → Production testing
│   ├── verify_models.py               → Model verification
│   ├── requirements.txt               → Python dependencies
│   ├── runtime.txt                    → Python version (3.11)
│   ├── Procfile                       → Render/Heroku config
│   └── ALIGNMENT_GUIDE.md             → Alignment documentation
│
├── 🏗️ BACKEND API (`app/backend/`)
│   ├── __init__.py
│   ├── server.py                      → ⚠️ PLACEHOLDER (not used)
│   │
│   ├── 📋 api/
│   │   ├── __init__.py
│   │   └── main.py                    → ✅ MAIN FASTAPI APP (1400+ lines)
│   │       ├── Authentication (4 endpoints)
│   │       ├── Inference (4 endpoints)
│   │       ├── Events (6 endpoints)
│   │       ├── Admin (5 endpoints)
│   │       ├── Reporting (1 endpoint)
│   │       └── Metadata (2 endpoints)
│   │
│   ├── 📊 database/
│   │   ├── __init__.py
│   │   ├── db.py                      → Database operations & setup
│   │   │   ├── create_db()
│   │   │   ├── get_db()
│   │   │   ├── save_event()
│   │   │   ├── get_all_events()
│   │   │   └── get_events_by_label()
│   │   └── models.py                  → SQLAlchemy ORM models
│   │       ├── HazardEvent table
│   │       ├── User table
│   │       └── HazardReport table
│   │
│   ├── 🤖 models/
│   │   ├── __init__.py
│   │   └── model_loader.py            → ML model loading (singleton)
│   │       ├── load_all_models()
│   │       ├── _load_model()
│   │       ├── is_ready()
│   │       └── get_status()
│   │
│   ├── 🧠 inference/
│   │   ├── __init__.py
│   │   └── inference.py               → Multimodal inference pipeline
│   │       ├── predict_sensor()
│   │       ├── predict_vision()
│   │       ├── predict_multimodal()
│   │       ├── predict_batch()
│   │       ├── _predict_sensor_internal()
│   │       └── HazardInferencePipeline class
│   │
│   ├── 👁️ vision/
│   │   ├── __init__.py
│   │   └── vision_inference.py        → YOLO vision pipeline
│   │       ├── predict_image()
│   │       ├── _load_model()
│   │       ├── is_ready()
│   │       └── VisionInferencePipeline class
│   │
│   ├── 🔀 fusion/
│   │   ├── __init__.py
│   │   └── fusion.py                  → Sensor-vision fusion
│   │       ├── fuse_predictions()
│   │       ├── ProbabilisticFusion class
│   │       ├── HazardType enum
│   │       └── FusionResult class
│   │
│   ├── 📈 preprocessing/
│   │   ├── __init__.py
│   │   └── preprocess.py              → Accelerometer preprocessing
│   │       └── preprocess_accel()     → Signal processing pipeline
│   │
│   ├── 🛠️ utils/
│   │   ├── __init__.py
│   │   ├── config.py                  → Configuration management
│   │   │   ├── PROJECT_PATHS
│   │   │   ├── MODEL_PATHS
│   │   │   ├── API_CONFIG
│   │   │   ├── JWT_CONFIG
│   │   │   └── PREPROCESSING_CONFIG
│   │   ├── schemas.py                 → Pydantic models
│   │   │   ├── PredictionRequest
│   │   │   ├── PredictionResponse
│   │   │   ├── MultimodalPredictionRequest
│   │   │   ├── MultimodalPredictionResponse
│   │   │   ├── BatchPredictionRequest
│   │   │   ├── BatchPredictionResponse
│   │   │   ├── UserSignupRequest
│   │   │   ├── UserLoginRequest
│   │   │   ├── TokenResponse
│   │   │   └── etc.
│   │   └── deduplication.py           → Duplicate detection
│   │       ├── is_duplicate()
│   │       └── Spatial/temporal logic
│   │
│   └── __pycache__/                   → Python cache
│
├── 🎨 FRONTEND ADMIN (`frontend/admin/`)
│   ├── index.html                     → HTML entry point
│   ├── package.json                   → Dependencies (React 18, Vite 5)
│   ├── package-lock.json
│   ├── vite.config.js                 → ⚠️ Hardcoded localhost:8000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   │
│   ├── src/
│   │   ├── App.jsx                    → Main app component
│   │   ├── main.jsx                   → React entry point
│   │   ├── index.css                  → Global styles
│   │   │
│   │   ├── components/                → Reusable components (10 files)
│   │   │   ├── Badge.jsx
│   │   │   ├── BadgeCard.jsx
│   │   │   ├── BottomNav.jsx          → Bottom navigation
│   │   │   ├── Card.jsx
│   │   │   ├── MapView.jsx            → Leaflet map
│   │   │   ├── Sidebar.jsx            → Left sidebar
│   │   │   ├── StatCard.jsx           → Statistics
│   │   │   ├── Toast.jsx              → Notifications
│   │   │   ├── ToggleSwitch.jsx
│   │   │   └── TopNav.jsx             → Top navigation
│   │   │
│   │   ├── pages/                     → Page components (16 files)
│   │   │   ├── HomePage.jsx           → Landing page
│   │   │   ├── AdminDashboard.jsx     → Admin overview
│   │   │   ├── AdminHazards.jsx       → Hazard management
│   │   │   ├── AnalyticsPage.jsx      → Analytics & charts
│   │   │   ├── ActivityPage.jsx       → Activity feed
│   │   │   ├── HazardMap.jsx          → Hazard map
│   │   │   ├── LoginPage.jsx          → Login form
│   │   │   ├── MapPage.jsx            → Map view
│   │   │   ├── NavigatePage.jsx       → Navigation
│   │   │   ├── Overview.jsx           → System overview
│   │   │   ├── ProfilePage.jsx        → User profile
│   │   │   ├── ReportPage.jsx         → Report generation
│   │   │   ├── Reports.jsx            → Reports list
│   │   │   ├── Settings.jsx           → Settings
│   │   │   ├── UploadPage.jsx         → Image upload
│   │   │   └── Users.jsx              → User management
│   │   │
│   │   ├── context/                   → State management (2 files)
│   │   │   ├── AdminContext.jsx       → Admin state
│   │   │   └── RealTimeContext.jsx    → Real-time updates
│   │   │
│   │   ├── utils/                     → Utilities (3 files)
│   │   │   ├── api.js                 → API client
│   │   │   ├── helpers.js             → Helper functions
│   │   │   └── mockData.js            → Demo data
│   │   │
│   │   └── styles/                    → CSS files
│   │
│   └── node_modules/                  → Dependencies (1000+ packages)
│
├── 📱 DASHBOARD (`dashboard/`)
│   ├── index.html
│   ├── package.json                   → React 19, Vite
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   └── node_modules/
│
├── 📱 MOBILE APP (`mobile/`)
│   ├── App.tsx                        → Main app component (TypeScript)
│   ├── index.js                       → Entry point
│   ├── app.json                       → Expo app config
│   ├── app.json
│   ├── babel.config.js
│   ├── eas.json                       → EAS build config
│   ├── jest.config.js
│   ├── metro.config.js
│   ├── package.json                   → React Native, Expo 55
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── .env                           → Environment config
│   ├── QUICK_START.md
│   ├── README.md
│   ├── SETUP.md
│   ├── STATUS.txt
│   ├── REBUILD_SUMMARY.md
│   ├── COMPLETE_FIX_REPORT.md
│   │
│   ├── src/
│   │   ├── screens/                   → Mobile screens
│   │   │   ├── home/                  → Home screen
│   │   │   ├── report/                → Report screen
│   │   │   ├── history/               → History screen
│   │   │   ├── settings/              → Settings
│   │   │   └── onboarding/            → Onboarding screens
│   │   │
│   │   ├── components/                → Reusable components
│   │   │   ├── HazardCard.jsx
│   │   │   ├── SeverityBadge.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── WeatherWidget.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   └── BottomNav.jsx
│   │   │
│   │   ├── context/                   → State management
│   │   ├── services/                  → API services
│   │   ├── utils/                     → Utilities
│   │   └── navigation/                → Navigation setup
│   │
│   ├── assets/                        → Images & icons
│   ├── __tests__/                     → Jest tests
│   ├── offlineapp/                    → Offline functionality
│   ├── roadhazard_backup/             → Backup files
│   │
│   └── node_modules/                  → Dependencies (~1200 packages)
│
├── 🎓 TRAINING (`training/`)
│   ├── model_registry.py              → Model version management
│   ├── train_all.py                   → Training orchestrator
│   └── (Model training scripts)
│
├── 🤖 MODELS (`models/`)
│   ├── best.pt                        → YOLO model
│   ├── stage1_binary_v2.keras         → Stage 1 model
│   ├── stage2_subtype_v2.keras        → Stage 2 model
│   └── stage2_hazard_classification.h5 → Alternative Stage 2
│
├── 📊 DATA (`data/`)
│   └── (Dataset files - may be gitignored)
│
├── 🗂️ BACKEND ROOT (`backend/`)
│   ├── __init__.py
│   ├── main.py                        → ⚠️ Alternative entry point (unused)
│   ├── models.py                      → Pydantic models
│   ├── database.py                    → DB setup
│   ├── auth.py                        → Authentication
│   ├── routes.py                      → API routes
│   ├── websocket_manager.py           → WebSocket handling
│   ├── seed.py                        → Test data generator
│   └── requirements.txt               → Dependencies (alternative)
│
├── 📁 DOCS (`docs/`)
│   └── (Additional documentation)
│
├── 🎨 ASSETS (`assets/`)
│   └── theme.json                     → Theme configuration
│
├── 📱 ROADHAZARD_BACKUP (`roadhazard_backup/`)
│   ├── archive/
│   ├── logs/
│   ├── ml/
│   ├── PotholeSpeedbump_detection.v1-1.yolov8/
│   ├── processed_accel_only_fixed/
│   ├── results/
│   ├── scripts/
│   └── tests/
│
└── 🚀 ROOT CONFIGURATION FILES
    ├── .gitignore
    ├── Procfile                       → Render deployment
    └── runtime.txt                    → Python 3.11
```

---

## 🎯 Quick File Lookup

### **Need to modify API endpoints?**
→ `app/backend/api/main.py` (lines 1-1500)

### **Need to modify database schema?**
→ `app/backend/database/models.py`

### **Need to change ML model loading?**
→ `app/backend/models/model_loader.py`

### **Need to modify inference pipeline?**
→ `app/backend/inference/inference.py`

### **Need to change frontend dashboard?**
→ `frontend/admin/src/pages/AdminDashboard.jsx`

### **Need to modify API client?**
→ `frontend/admin/src/utils/api.js`

### **Need to change mobile app screens?**
→ `mobile/src/screens/`

### **Need to update configuration?**
→ `app/backend/utils/config.py`

### **Need to understand project?**
→ `PROJECT_ANALYSIS.md` (this file)

---

## 🔗 Key Imports & Modules

### Backend Main Imports
```python
# API Framework
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Authentication
from jose import jwt
from passlib.context import CryptContext
import bcrypt

# ML
import tensorflow as tf
from ultralytics import YOLO

# HTTP
import httpx
import aiofiles
```

### Frontend Admin Imports
```javascript
// Core
import React, { useState, useContext } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Styling
import { useEffect } from 'react'

// External
import axios from 'axios'
import L from 'leaflet'
import { LineChart, BarChart } from 'recharts'
```

### Mobile App Imports
```typescript
import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useStore } from 'zustand'
import axios from 'axios'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
```

---

## 📋 Environment Variables Needed

### Backend (.env)
```bash
# Server
PORT=8000
HOST=0.0.0.0

# JWT
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRY_DAYS=7

# Database
DATABASE_URL=sqlite:///./data/roadguard.db
# Or MongoDB:
# MONGODB_URL=mongodb://localhost:27017/roadguard

# Models
MODEL_DIR=./models
DEVICE=auto  # or gpu, cpu

# API Keys (optional)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
OPENWEATHER_API_KEY=

# Logging
LOG_LEVEL=INFO
```

### Frontend Admin (.env)
```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Mobile (.env)
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GEOLOCATION_ENABLED=true
```

---

## 🚀 Running Each Component

### Start Backend
```bash
cd app
python -m uvicorn backend.api.main:app --reload --port 8000
```

### Start Admin Dashboard
```bash
cd frontend/admin
npm install
npm run dev  # Port 5174
```

### Start Dashboard
```bash
cd dashboard
npm install
npm run dev  # Port 5173
```

### Start Mobile App
```bash
cd mobile
npm install
npm start  # Expo
npm run android  # Build APK
```

---

## ✅ Testing Commands

```bash
# Test backend health
curl http://localhost:8000/api/health

# Test API info
curl http://localhost:8000/api/info

# Test prediction
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [[0.1, 0.2, 0.3], ...100 times...]}'

# Run production validation
python test_production_api.py

# Verify models
python verify_models.py
```

---

## 📊 Build Status

| Component | Framework | Build Tool | Status |
|-----------|-----------|-----------|--------|
| Backend | FastAPI | Python | ✅ Ready |
| Admin | React 18 | Vite | ✅ Ready |
| Dashboard | React 19 | Vite | ✅ Ready |
| Mobile | React Native | Expo | ✅ Ready |

---

## 🎓 File Statistics

| Category | Count | Status |
|----------|-------|--------|
| Python files | 67 | ✅ Complete |
| JSX/TSX files | 74+ | ✅ Complete |
| Configuration files | 20+ | ✅ Complete |
| Documentation files | 15+ | ✅ Complete |
| Test files | 5+ | ⚠️ Minimal |
| Model files | 3 | ✅ Available |

---

## 🔐 Security Notes

- JWT secret hardcoded in `config.py` → Move to .env
- CORS allows all origins → Restrict in production
- Password hashing uses bcrypt ✅
- API validation with Pydantic ✅
- Admin endpoints protected ✅
- No SQL injection vulnerable code ✅

---

**Created**: April 24, 2026  
**Status**: Complete reference guide  
**For**: RoadGuard Project Analysis
