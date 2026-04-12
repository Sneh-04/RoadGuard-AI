# ⚡ RoadGuard Quick Start

**Get running in 5 minutes**

---

## 🚀 Start Everything

```bash
# Terminal 1: Backend (port 8002)
cd /Users/pawankumar/Desktop/RoadGuard_Final/backend
python main.py

# Terminal 2: Admin Dashboard (port 5174)
cd /Users/pawankumar/Desktop/RoadGuard_Final/frontend/admin
npm install
npm run dev

# Terminal 3: Mobile App (Vite dev server)
cd /Users/pawankumar/Desktop/RoadGuard_Final/frontend/dashboard
npm install
npm run dev
```

---

## 📱 Open in Browser

```
Admin Dashboard: http://localhost:5174
Login: admin / admin123

Mobile App: Usually auto-opens from Vite
Or navigate to: http://localhost:5173
```

---

## 📊 Load Test Data (Optional)

```bash
# Generate 5 test reports
cd /Users/pawankumar/Desktop/RoadGuard_Final/backend
python seed.py

# For 40 reports (stress test), run 8 times:
for i in {1..8}; do python seed.py; sleep 1; done
```

---

## 🎬 Quick Demo (5 min)

1. **Mobile**: Turn OFF internet (Airplane mode)
2. **Mobile**: Submit hazard report
3. **Mobile**: See report marked "⏳ PENDING" in History
4. **Mobile**: Turn ON internet
5. **Mobile**: Wait 30 seconds, report changes to "✅ SYNCED"
6. **Dashboard**: Watch new marker appear on map
7. **Done!**

---

## 🔗 Links

| What | URL |
|------|-----|
| Admin Dashboard | http://localhost:5174 |
| Backend API | http://localhost:8002 |
| Mobile App | http://localhost:5173 |
| Full Demo Guide | [DEMO.md](DEMO.md) |
| Demo Checklist | [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md) |
| Complete Guide | [PROJECT_README.md](PROJECT_README.md) |
| Stress Test Report | [STRESS_TEST_REPORT.md](STRESS_TEST_REPORT.md) |

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Port 8002 in use | `lsof -i :8002` then `kill -9 <PID>` |
| MongoDB error | Expected (in-memory storage used instead) |
| npm install error | `rm -rf node_modules package-lock.json` then retry |
| Map not showing | Refresh browser, check test data loaded |
| GPS not working | Grant permissions or use mock coordinates |

---

## 🎯 Backend API Quick Test

```bash
# Check if running
curl http://localhost:8002/api/admin/complaints

# Should return: {"detail":"Invalid token"}
# (That's OK - means backend is responding)
```

---

## 📱 Mobile Features

- ✅ **Report**: Submit with GPS + photo
- ✅ **History**: View pending & synced reports
- ✅ **Settings**: See network status & manual sync
- ✅ **Offline**: Works without internet

---

## 🎮 Demo Dashboard

- ✅ **Map**: See all hazards color-coded by priority
- ✅ **Analytics**: Track trends and statistics
- ✅ **Reports**: Manage and update statuses
- ✅ **Real-Time**: Live updates via WebSocket

---

## 📝 What's Included

✅ Stress-tested with 40+ reports  
✅ Mobile app with offline-first  
✅ Admin dashboard with real-time map  
✅ AI-powered priority system  
✅ Auto-sync when online  
✅ Complete documentation  

---

## ✅ Success = When You See

1. Backend returns: `{"detail":"Invalid token"}%`
2. Dashboard loads with map and markers
3. Mobile app submits reports offline
4. Reports sync automatically online
5. Dashboard updates in real-time

---

## 🎁 Next Steps

**For Demo**: See [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md)  
**For Details**: See [PROJECT_README.md](PROJECT_README.md)  
**For Results**: See [STRESS_TEST_REPORT.md](STRESS_TEST_REPORT.md)  

---

**Ready?** Let's go! 🚀
