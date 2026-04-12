# RoadGuard - Quick Start Guide

Welcome! This guide will get you up and running with the complete RoadGuard system in under 15 minutes.

---

## What is RoadGuard?

RoadGuard is a **road hazard detection and management system** with:
- 📱 **Mobile App** - Offline-first Android app to report hazards with GPS + photos
- 💻 **Admin Dashboard** - Web interface to view, analyze, and manage reports
- 🔧 **Backend API** - Syncs data between mobile app and dashboard

---

## Prerequisites (5 minutes)

### Required:
1. **Node.js 16+** - [Download](https://nodejs.org/)
2. **Python 3.9+** - [Download](https://www.python.org/)
3. **Git** - [Download](https://git-scm.com/)

### For Mobile Testing (Android):
4. **Android Studio** - [Download](https://developer.android.com/studio)
5. **JDK 11+** - Installed with Android Studio

### Quick Check:
```bash
node --version        # Should be 16+
python --version      # Should be 3.9+
git --version         # Should be 2+
```

---

## Part 1: Start the Backend (2 minutes)

```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

✅ **Success**: You'll see:
```
INFO:     Started server process [XXXX]
INFO:     Uvicorn running on http://0.0.0.0:8002
```

**Backend URL**: `http://localhost:8002`

---

## Part 2: Start the Admin Dashboard (2 minutes)

```bash
# In a NEW terminal, navigate to admin dashboard
cd frontend/admin

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ **Success**: You'll see:
```
VITE v4.5.0  ready in XXX ms
➜  Local:   http://localhost:5174/
```

### Login to Dashboard
1. Open **http://localhost:5174/**
2. **Email**: `admin@roadguard.in`
3. **Password**: `roadguard@admin2024`

🎉 You're now on the dashboard! Explore:
- Overview tab - KPIs and charts
- Map tab - Interactive hazard map
- Reports tab - Manage complaints

---

## Part 3: Set Up Mobile App (Optional - for Android testing)

### Option A: Quick Start (For Testing)

```bash
# In a NEW terminal
cd mobile/offlineapp

# Install dependencies
npm install

# Start Metro bundler (keep this running)
npm start
```

### Option B: Full Android Setup

**If you have Android Studio + emulator:**

```bash
# In another terminal (with Metro already running)
npm run android
```

⏳ Wait 30-60 seconds for the app to build and launch on the emulator/device.

✅ **App Features**:
- **Report Tab** - Capture hazards with photo + GPS
- **History Tab** - View pending/synced reports
- **Settings Tab** - Configure backend API URL

**Configure Backend URL in Mobile App:**
1. Go to Settings tab in the mobile app
2. Enter API URL: `http://YOUR_MACHINE_IP:8002/api`
   - Get your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Example: `http://192.168.1.100:8002/api`
3. Tap Save

---

## Testing Workflow

### Test 1: Submit Report via Mobile → View in Dashboard

**On Mobile App:**
1. Go to Report tab
2. Tap "Take Photo" and capture an image
3. Enter description (e.g., "Pothole on Main St")
4. Tap Submit
5. Go to History tab → Should show in "Pending"

**On Dashboard:**
1. Go to Reports page
2. Look for the new report
3. Click to view details and photo
4. Click "Mark In Progress" or "Mark Resolved"

**On Mobile:**
1. Go to History tab
2. After 30 seconds, sync happens automatically
3. Report moves from "Pending" to "Synced"

### Test 2: Offline Functionality

**On Mobile:**
1. Enable Airplane Mode
2. Submit another report
3. Go to History → Shows as "Pending"
4. Network indicator is orange "Offline"

**Disable Airplane Mode:**
1. Turn off Airplane Mode
2. App shows green "Online"
3. Within 30 seconds, auto-sync triggers
4. Report moves to "Synced"

### Test 3: Map Integration

**On Dashboard:**
1. Go to Map tab
2. See colored markers for reports
3. Click a marker to see:
   - Photo of hazard
   - GPS coordinates
   - Description
   - Status

---

## Project Structure

```
RoadGuard_Final/
├── backend/                    # FastAPI server (port 8002)
│   ├── main.py                # Start here
│   ├── requirements.txt        # Python packages
│   └── ...
├── frontend/
│   └── admin/                 # React dashboard (port 5174)
│       ├── package.json       # npm packages
│       └── src/
├── mobile/
│   └── offlineapp/            # React Native Android app
│       ├── package.json
│       ├── App.js
│       └── src/
├── PROJECT_OVERVIEW.md        # Complete system documentation
└── README.md                  # This file
```

---

## Default Credentials

**Admin Dashboard Login:**
```
Email: admin@roadguard.in
Password: roadguard@admin2024
```

---

## Common Issues

### Issue: Backend won't start
```bash
# Make sure you're in backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Try again
python main.py
```

### Issue: Dashboard shows "Cannot connect to backend"
- Check if backend is running (see Part 1)
- Make sure backend is on `http://localhost:8002`
- Try refreshing the page (Ctrl+R or Cmd+R)

### Issue: Mobile app won't connect
- Make sure backend API URL is correct in Settings
- Use `http://YOUR_MACHINE_IP:8002/api` (not `localhost`)
- Check that mobile device can ping your machine

### Issue: Port already in use
```bash
# Backend (port 8002)
sudo lsof -i :8002          # View what's using port
kill -9 <PID>               # Kill the process

# Dashboard (port 5174)
sudo lsof -i :5174
kill -9 <PID>
```

---

## What's Next?

### Once You're Comfortable:
1. **Read PROJECT_OVERVIEW.md** - Detailed architecture
2. **Read frontend/admin/README_ADMIN.md** - Dashboard features
3. **Read mobile/README.md** - Mobile app architecture
4. **Read mobile/SETUP.md** - Advanced Android setup

### Deploy to Production:
1. Set up MongoDB database (optional, uses memory fallback)
2. Configure environment variables
3. Build release APK for mobile
4. Deploy backend to server
5. Deploy dashboard to web host

---

## Features Summary

### Mobile App ✅
- ✅ Capture hazard photos
- ✅ Record GPS location
- ✅ Offline storage (SQLite)
- ✅ Auto-sync when online
- ✅ Retry failed syncs
- ✅ View submission history
- ✅ Configure backend URL

### Admin Dashboard ✅
- ✅ View all reports
- ✅ Interactive map display
- ✅ Real-time analytics
- ✅ Manage complaint status
- ✅ View hazard photos
- ✅ Activity logging
- ✅ User authentication

### Backend API ✅
- ✅ JWT authentication
- ✅ RESTful endpoints
- ✅ Auto-priority calculation
- ✅ Geospatial queries
- ✅ Sync tracking
- ✅ Activity logging

---

## Getting Help

### Debug Tips:
1. **Check Logs**: Look at terminal output for error messages
2. **Console Errors**: Open browser dev tools (F12) and check console
3. **Mobile Logs**: Run `adb logcat` to see app logs
4. **API Docs**: Open `http://localhost:8002/docs` for API documentation

### Support:
- Check relevant README files in each folder
- Review PROJECT_OVERVIEW.md for architecture
- Check mobile/SETUP.md for Android-specific issues

---

## Key Ports

- **Backend API**: `http://localhost:8002`
- **API Documentation**: `http://localhost:8002/docs`
- **Admin Dashboard**: `http://localhost:5174`
- **React Native Metro**: `http://localhost:8081`

---

## Success Checklist

- [ ] Backend running on port 8002
- [ ] Dashboard accessible on port 5174
- [ ] Logged into dashboard with default credentials
- [ ] Mobile app installed and running (optional)
- [ ] Mobile app synced to backend via API URL
- [ ] Test submission: Report created, synced to dashboard
- [ ] Test map: Report visible on dashboard map
- [ ] Test offline: Submission works offline, syncs when online

✅ **If all checked**: Your RoadGuard system is operational!

---

## Next Steps

1. **Explore Dashboard**
   - Click around, view reports
   - Try different filters
   - Check the map

2. **Test Mobile (if set up)**
   - Submit a report
   - See it appear in dashboard
   - Verify photo and location
   - Test offline sync

3. **Review Code**
   - Backend: `backend/main.py`
   - Dashboard: `frontend/admin/src/App.jsx`
   - Mobile: `mobile/offlineapp/App.js`

4. **Customize**
   - Change colors/branding
   - Add new report fields
   - Extend features

---

## Files to Read Next

1. **PROJECT_OVERVIEW.md** - Complete system architecture (read first)
2. **backend/README.md** - Backend API details
3. **frontend/admin/README_ADMIN.md** - Dashboard guide
4. **mobile/README.md** - Mobile app documentation
5. **mobile/SETUP.md** - Detailed Android setup

---

## Troubleshooting Checklist

- [ ] Is Node.js installed? (`node --version`)
- [ ] Is Python installed? (`python --version`)
- [ ] Are you in the correct directory? (`pwd`)
- [ ] Did you run `npm install`? (Check node_modules folder)
- [ ] Did you run `pip install -r requirements.txt`? (For backend)
- [ ] Are ports 8002, 5174 available?
- [ ] Is backend running? (Check terminal)
- [ ] Is dashboard running? (Check terminal)

---

## Quick Reference Commands

```bash
# Backend
cd backend && python main.py

# Dashboard (in new terminal)
cd frontend/admin && npm start

# Mobile (in new terminal)
cd mobile/offlineapp && npm start

# Run on Android
npm run android

# View mobile logs
adb logcat com.roadguard.mobile:V

# Check if backend is running
curl http://localhost:8002/health

# Kill port (if needed)
sudo lsof -i :8002 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## System Requirements Summary

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 4GB | 8GB+ |
| Disk | 5GB | 20GB+ |
| Node.js | 16 | 18-20 LTS |
| Python | 3.9 | 3.10-3.11 |
| Android API | 21 | 34+ |

---

🎉 **You're all set! Enjoy exploring RoadGuard!**

For detailed information, see **PROJECT_OVERVIEW.md**

---

**Version**: 1.0.0
**Last Updated**: 2024
**Status**: ✅ Ready to Go
