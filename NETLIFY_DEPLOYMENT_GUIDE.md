# 🚀 RoadGuard Dashboard - Netlify Deployment Guide

## **Option 1: Manual Deployment (Upload ZIP)**

### Step 1: Build the Project
```bash
cd /Users/pawankumar/Desktop/RoadGuard_Final/frontend/dashboard
npm run build
```

This creates a **`dist/`** folder with all compiled files.

### Step 2: Upload to Netlify

1. Go to **[netlify.com](https://netlify.com)**
2. Sign in or create account
3. Click **"Add new site"** → **"Deploy manually"**
4. **Drag & drop the `dist/` folder** from your computer
5. Wait for deployment to complete ✅

**Netlify URL** will be displayed: `https://your-site-name.netlify.app`

---

## **Option 2: Git Integration (Recommended - Auto-Deploy)**

### Step 1: Push to GitHub
```bash
cd /Users/pawankumar/Desktop/RoadGuard_Final
git add .
git commit -m "RoadGuard Dashboard ready for Netlify"
git push origin main
```

### Step 2: Connect to Netlify
1. Go to **[netlify.com](https://netlify.com)**
2. Click **"New site from Git"**
3. Select **GitHub** and authorize
4. Choose your repository
5. **Build settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click **"Deploy site"** ✅

**Auto-deployment**: Every time you push to GitHub, Netlify auto-rebuilds and deploys!

---

## **Files You Need to Upload**

### **Manual Upload (ZIP method):**
- **Folder to upload**: `frontend/dashboard/dist/`
- **Size**: ~500KB (after build)
- **Contains**: index.html, JS, CSS, assets

### **Git Integration:**
- Netlify auto-builds from your GitHub repo
- Uses `netlify.toml` configuration (already created ✅)
- Uses `package.json` for build commands

---

## **Environment Variables (Important!)**

### For Production API Integration:
1. In Netlify dashboard → **Site settings** → **Build & deploy** → **Environment**
2. Add environment variable:
   ```
   VITE_API_BASE = https://your-production-backend-api.com
   ```

### Local Testing:
```bash
cd frontend/dashboard
npm run build
npm run preview
# Opens http://localhost:4173 with production build
```

---

## **What Gets Deployed**

✅ **Included in deployment:**
- React Dashboard UI
- All 6 screens (Home, Report, Navigate, Activity, AI Demo, Profile)
- Sensor simulation
- Model demo
- Real-time charts
- Admin dashboard link

⚠️ **NOT included (runs separately):**
- Backend API (Python/FastAPI - deploy separately)
- Database (needs separate hosting)
- Models (TensorFlow/YOLOv8 - in backend)

---

## **After Deployment**

### 1. Test the Dashboard
- Visit your Netlify URL
- Click through all tabs
- Verify responsive design (mobile/desktop)

### 2. Connect to Backend
- Update `VITE_API_BASE` environment variable
- Backend should be running at production URL
- API calls will work from frontend

### 3. Monitor Performance
- Netlify Analytics (built-in)
- Browser DevTools
- Network tab to verify API calls

---

## **Troubleshooting**

| Issue | Solution |
|-------|----------|
| **Blank page** | Clear cache (Ctrl+Shift+Del), check console for errors |
| **404 errors** | Netlify.toml redirect rule should fix (auto-routing to index.html) |
| **API calls fail** | Check `VITE_API_BASE` environment variable matches backend URL |
| **Slow load** | Images need optimization (check dist/ folder size) |
| **Build fails** | Check `npm run build` works locally first |

---

## **Quick Deploy Command (Git Method)**

```bash
# 1. Build locally
cd frontend/dashboard && npm run build

# 2. Test build
npm run preview

# 3. Push to GitHub (Netlify auto-deploys)
git add . && git commit -m "Deploy" && git push

# 4. Visit your Netlify dashboard to see live deployment
```

---

## **Files Created for Deployment:**
- ✅ `netlify.toml` - Build configuration
- ✅ `.env.production` - Production environment variables
- ✅ `dist/` - Build output (created after `npm run build`)

---

**Status: ✨ Ready for Netlify Deployment! 🚀**
