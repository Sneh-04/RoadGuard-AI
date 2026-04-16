# Testing Guide: Pothole Upload → Admin Alert Feature

## Prerequisites
- Backend running at IP: 10.62.86.163:8000
- Mobile app started with Expo
- Two devices/emulators: one for user, one for admin

## Test Steps

### 1. BACKEND SETUP
```bash
cd /Users/pawankumar/Desktop/RoadHazardProject/app
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000
```
Wait for: "Application startup complete"

### 2. MOBILE APP SETUP
```bash
cd /Users/pawankumar/Desktop/RoadHazardProject/mobile
npm install  # If not done
npx expo start --lan --clear
# Press 'w' for web preview or scan QR code with phone
```

### 3. USER FLOW TEST

#### A. Login as User
- Start app on phone/emulator
- Create new account: email: user@test.com, password: password123, role: user
- OR login with existing user account
- Should see HomeScreen with "Report a Hazard" button

#### B. Take/Upload Photo
1. Click "Report a Hazard" button
2. See HazardReportScreen with image selection UI
3. Click image placeholder area
4. Choose "Take Photo" or "Choose from Gallery"
5. Confirm/select image
6. Should see:
   - Image preview
   - Current location (latitude/longitude)
   - Description field with "Pothole detected" (editable)
   - "Submit Report" button

#### C. Submit Report
1. Optionally edit description
2. Click "Submit Report" button
3. Should see loading spinner then:
   - ✅ "Report submitted successfully!" message
   - Success notification: "Your hazard report has been submitted to the admin team!"
4. Back button returns to HomeScreen

### 4. ADMIN FLOW TEST

#### A. Login as Admin  
- Start app on different device/emulator
- Create new account: email: admin@test.com, password: password123, role: admin
- OR login with admin account
- Should see AdminNavigator with "Alerts" tab available

#### B. View Reports
1. Click "Alerts" tab in bottom navigation
2. Should see:
   - "Hazard Reports" header
   - Filter buttons: All, Pending, Reviewed, Resolved
   - List of reports (if any submitted)

#### C. Check Report Details
- If user submitted report, admin should see:
  - Report card with:
    - 🟠 "PENDING" badge (if not reviewed yet)
    - Report #ID
    - 📸 Image placeholder
    - Description
    - 📍 Location coordinates
    - 🕐 "Reported X minutes ago"
    - "Review" and "Resolve" buttons

#### D. Update Report Status
1. Click "Review" button
   - Status changes to "REVIEWED"
   - Badge turns yellow (👁️ REVIEWED)
   - Buttons update to show only "Mark as Resolved"
2. Click "Mark as Resolved"
   - Status changes to "RESOLVED"
   - Badge turns green (✅ RESOLVED)
   - No buttons shown

#### E. Test Filters
1. Click "Pending" filter
   - Only shows pending reports
2. Click "Reviewed" filter
   - Only shows reviewed reports
3. Click "Resolved" filter
   - Only shows resolved reports
4. Click "All" filter
   - Shows all reports

### 5. VERIFY AUTO-REFRESH
1. In admin app, wait 30 seconds
2. App should auto-refresh the list
3. New user-submitted reports should appear

### 6. VERIFY PULL-TO-REFRESH
1. In admin app, pull down on report list
2. Spinning refresh indicator should appear
3. List should refresh
4. Indicator should disappear

## Expected Behavior Summary

### ✅ Should Work
- User uploads image from camera or gallery
- User can edit description
- Locations are auto-fetched
- Report succeeds with confirmation
- Admin sees new reports within 30 seconds
- Admin can mark reports as reviewed/resolved
- Filter buttons work correctly
- Empty state shows when no reports

### ❌ Common Issues & Fixes

**Issue: "Network error" on upload**
- Check backend is running: `curl http://10.62.86.163:8000/api/health`
- Check API_BASE_URL in mobile/src/config/api.ts

**Issue: App crashes on HazardReportScreen**
- Check expo-image-picker is installed: `npm list expo-image-picker`
- Check imageService.ts imports are correct

**Issue: Admin can't see reports**
- Check backend /api/admin/reports endpoint: `curl -H "Authorization: Bearer TOKEN" http://10.62.86.163:8000/api/admin/reports`
- Ensure user account has role: "admin"

**Issue: Location not showing**
- Enable location services on phone
- Check useLocation hook returns data

## Success Criteria

Student demo passes if:
1. ✅ User can upload pothole image from phone
2. ✅ Admin immediately sees alert in AdminAlertsScreen
3. ✅ Admin can mark hazard as reviewed/resolved
4. ✅ No crashes during workflow
5. ✅ UI is responsive and shows proper feedback

## Database Notes

Reports saved to: `hazard_reports` table
Images stored in: `./reports/` directory
Status progression: pending → reviewed → resolved
