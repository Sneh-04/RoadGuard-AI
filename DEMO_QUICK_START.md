# 🚀 RoadGuard - Demo Quick Start Guide

## ⏱️ 30-SECOND STARTUP

### Terminal 1: Start Backend
```bash
cd ~/Desktop/RoadGuard_Final/backend
python main.py
```
Wait for: `Uvicorn running on http://127.0.0.1:8002`

### Terminal 2: Start Admin Panel
```bash
cd ~/Desktop/RoadGuard_Final/frontend/admin
npm run dev
```
Wait for: `VITE v5... ready in XXX ms`

### Terminal 3: Start Dashboard
```bash
cd ~/Desktop/RoadGuard_Final/frontend/dashboard
npm run dev
```
Wait for: `VITE v5... ready in XXX ms`

---

## 🌐 OPEN IN BROWSER

| App | URL | Features |
|-----|-----|----------|
| **Admin Panel** | http://localhost:5174 | Reports, Users, Analytics |
| **Dashboard** | http://localhost:5175 (or next available) | Map, Live Feed, Reports |

---

## 🔐 LOGIN OPTIONS

### Option 1: Demo Mode (RECOMMENDED)
1. Open Admin Panel
2. Click **"Demo Mode (Skip Login)"** button
3. Dashboard auto-loads ✅

### Option 2: Manual Login
- Email: `admin@roadguard.in`
- Password: `roadguard@admin2024`
- Click **"Sign in"** ✅

---

## ✅ DEMO WORKFLOW

### 1. Dashboard (User Perspective)
- View live hazard map
- Submit a road hazard report
- Check real-time alerts
- View statistics

### 2. Admin Panel (Admin Perspective)
- View all submitted complaints
- Filter by status/priority
- Mark as "In Progress" or "Resolved"
- View detailed analytics

### 3. Real-Time Sync (Optional)
- Submit a complaint in dashboard
- It appears immediately in admin panel
- Automatic WebSocket updates

---

## 🛠️ WHAT WAS FIXED

### Backend
✅ Removed duplicate configurations
✅ Fixed undefined variables
✅ Enabled CORS
✅ Added demo auth bypass

### Admin Frontend
✅ Fixed 8 JSX errors
✅ Fixed duplicate exports
✅ Added demo mode button
✅ Configured API proxy

### Dashboard Frontend
✅ Fixed API endpoints
✅ Fixed TypeScript version
✅ Configured WebSocket proxy
✅ Updated API base URL

---

## 🆘 TROUBLESHOOTING

### "Port already in use"
```bash
# Use different port
cd frontend/admin
npm run dev -- --port 5180
```

### "Cannot connect to backend"
- Ensure backend is running: `http://localhost:8002`
- Check CORS: Backend allows all origins
- Demo mode still works with mock data

### "White screen in browser"
- Clear browser cache: `Ctrl+Shift+Del`
- Full page reload: `Ctrl+F5`
- Check browser console for errors (F12 → Console)

### "API calls returning 404"
- Backend must be running
- Admin API: `http://localhost:8002/api/admin`
- Dashboard API: `http://localhost:8002`

---

## 📊 EXPECTED RESULTS

After 30 seconds, you should see:

✅ **Admin Panel:**
- Login page with "Demo Mode" button
- After login: Dashboard with sample reports
- Ability to filter, view, and update reports

✅ **Dashboard:**
- Map view with hazard markers
- Recent alerts/complaints list
- Statistics card (if backend connected)

✅ **Backend:**
- Console output showing incoming requests
- WebSocket connection logs (if connected)

---

## 🎓 DEMO TALKING POINTS

1. **Real-Time Monitoring**
   - Show live updates flowing from dashboard to admin
   - Show complaint status changes

2. **Mobile Integration**
   - Explain mobile app sync capability
   - Show offline queue → online sync

3. **Analytics**
   - Show dashboard stats
   - Show admin analytics (if available)

4. **Scalability**
   - Built on FastAPI + React
   - Supports WebSocket real-time updates
   - Can handle multiple concurrent users

---

## ⚙️ SYSTEM ARCHITECTURE

```
┌─────────────────┐
│  Mobile App     │
│  (Optional)     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────────────┐
│            Backend (FastAPI)                    │
│  - Routes: /api/admin/*                         │
│  - WebSocket: /ws/events                        │
│  Port: 8002                                     │
└──────────────┬──────────────┬─────────────────┘
               │              │
        ┌──────┴──────┐  ┌────┴──────┐
        ↓             ↓  ↓           ↓
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ Admin   │  │Dashboard │  │Database  │
   │ Port:   │  │Port: 5175│  │(Optional)│
   │ 5174    │  │          │  │          │
   └─────────┘  └──────────┘  └──────────┘
```

---

## 📞 SUPPORT

- All files: `~/Desktop/RoadGuard_Final/`
- Admin: `~/Desktop/RoadGuard_Final/frontend/admin/`
- Dashboard: `~/Desktop/RoadGuard_Final/frontend/dashboard/`
- Backend: `~/Desktop/RoadGuard_Final/backend/`
- Fixes Log: `~/Desktop/RoadGuard_Final/FIXES_SUMMARY.md`

---

**Status: ✅ READY FOR DEMO**

Last Updated: April 13, 2026
