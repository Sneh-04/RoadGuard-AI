/**
 * ========================================
 * REAL-TIME SENSOR SIMULATION SYSTEM
 * ========================================
 * 
 * OVERVIEW:
 * Implements a complete real-time sensor simulation pipeline that continuously
 * feeds mock sensor data into the frontend, processes hazard detection logic,
 * and updates the UI live without manual refresh or button clicks.
 * 
 * PURPOSE FOR DEMO:
 * This system simulates actual hardware sensor behavior (camera, vibration, GPS)
 * for live product demonstrations, showing how RoadGuard would work with real
 * connected sensors.
 * 
 * ========================================
 * ARCHITECTURE
 * ========================================
 * 
 * SENSOR DATA PIPELINE:
 * 
 * [Sensor Simulation] 
 *      ↓ (every 2-3 seconds)
 * [Data Generation] 
 *      ↓ (generates mock vibration, GPS, camera data)
 * [Processing Logic] 
 *      ↓ (applies hazard detection rules)
 * [Hazard Detection] 
 *      ↓ (if hazard detected)
 * [UI Update]
 *      ↓ (real-time dashboard refresh)
 * [Console Logging] 
 *      ↓ (demo visibility)
 * [Toast Notification] (optional)
 * 
 * 
 * ========================================
 * FILES ADDED/MODIFIED
 * ========================================
 * 
 * NEW FILES CREATED:
 * ─────────────────────────────────────
 * 
 * 1. /frontend/dashboard/src/utils/sensorSimulation.js
 *    └─ Core sensor simulation engine
 *    └─ Contains: generateSensorData(), processSensorData(), startSensorSimulation()
 *    └─ Lines: ~240
 *    └─ Exports:
 *       - generateSensorData(): Creates mock sensor readings
 *       - processSensorData(): Applies hazard detection logic
 *       - startSensorSimulation(): Main loop (runs every 2500ms by default)
 *       - generateInitialHazard(): For demo initialization
 * 
 * 2. /frontend/dashboard/src/hooks/useSensorSimulation.js
 *    └─ Custom React hook for managing simulation lifecycle
 *    └─ Lines: ~40
 *    └─ Provides: start(), stop(), isRunning()
 * 
 * 
 * MODIFIED FILES:
 * ─────────────────────────────────────
 * 
 * 1. /frontend/dashboard/src/screens/SensorData.jsx
 *    └─ Integrated real-time sensor simulation
 *    └─ Changes:
 *       • Added useSensorSimulation hook import
 *       • Added state: sensorStreamActive, lastHazardTime, hazardCount
 *       • Created handleHazardDetected callback
 *       • Added handleHazardDetected to addReport (AppContext)
 *       • Added visual "Live Sensor: ACTIVE" indicator with pulsing dot
 *       • Added stats showing live detections and last detection time
 *       • Updated all old teal colors to new blue theme
 *       • Reports now include sensor auto-detected hazards
 * 
 * 2. /frontend/dashboard/src/screens/admin/AdminDashboard.jsx
 *    └─ Integrated real-time sensor simulation for admin view
 *    └─ Changes:
 *       • Added useSensorSimulation hook import
 *       • Added state: sensorStreamActive, liveHazardCount, lastHazardTime
 *       • Created handleHazardDetected callback
 *       • Hazards added to reports in real-time
 *       • Added live sensor indicator at top of overview
 *       • Live hazard count updates dynamically
 *       • Toast notifications for new detections
 *       • Admin dashboard now shows incoming sensor data
 * 
 * 
 * ========================================
 * HOW IT WORKS
 * ========================================
 * 
 * STEP-BY-STEP FLOW:
 * 
 * 1. INITIALIZATION (Component Mount)
 *    └─ useSensorSimulation hook is called
 *    └─ Starts setInterval loop (every 2500ms)
 *    └─ Simulation state marked as ACTIVE
 * 
 * 2. SENSOR DATA GENERATION (every 2.5 seconds)
 *    └─ generateSensorData() called
 *    └─ Simulates:
 *       • Vibration levels (0-1, with strength classification)
 *       • GPS coordinates (mock Chennai locations)
 *       • Vehicle speed (20-80 km/h)
 *       • Camera confidence scores (60-90%)
 *       • X/Y/Z acceleration data
 * 
 * 3. HAZARD DETECTION LOGIC
 *    └─ processSensorData() analyzes vibration
 *    └─ Rule: If vibration > 0.65:
 *       • Determine severity based on vibration level + camera confidence
 *       • High severity: vibration > 0.85 AND camera confidence > 0.75
 *       • Medium severity: vibration > 0.75 OR camera confidence > 0.70
 *       • Low severity: else
 *       • Randomly select hazard type (Pothole, Speedbump, Flooding, etc.)
 * 
 * 4. HAZARD OBJECT CREATION
 *    └─ If hazard detected, create hazard object:
 *       {
 *         id: unique ID,
 *         type: "Pothole" | "Speedbump" | "Flooding" | "Road Debris" | "Crack",
 *         severity: "Low" | "Medium" | "High",
 *         confidence: 0.60 - 0.90,
 *         distance: 0.2 - 2.2 km,
 *         location: { city, address, latitude, longitude },
 *         timestamp: ISO timestamp,
 *         reporter: "System (Sensor)",
 *         status: "Pending",
 *         sensorId: "SENSOR_001",
 *         vibrationStrength: "LOW" | "MEDIUM" | "HIGH"
 *       }
 * 
 * 5. CALLBACK & UI UPDATE
 *    └─ onHazardDetected callback triggered
 *    └─ Hazard added to reports via addReport(hazard)
 *    └─ State updates:
 *       • hazardCount incremented
 *       • lastHazardTime updated
 *       • Toast notification shown
 * 
 * 6. LIVE DASHBOARD DISPLAY
 *    └─ Dashboard re-renders with new hazard
 *    └─ New entry appears at top of recent reports
 *    └─ Stats update (hazard count, last detection time)
 *    └─ Visual indicator shows "Live Sensor: ACTIVE" with pulsing dot
 * 
 * 7. CONSOLE LOGGING (Demo Visibility)
 *    └─ Timestamp and reading number logged
 *    └─ Sensor data details logged
 *    └─ Processing logic logged
 *    └─ If hazard detected:
 *       • Hazard details logged
 *       • Location logged
 *       • Severity logged
 * 
 * 
 * ========================================
 * CONSOLE LOG EXAMPLE
 * ========================================
 * 
 * 🚀 REAL-TIME SENSOR SIMULATION STARTED
 *    Interval: 2500ms
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * [2:45:30 PM] Sensor Reading #1
 * ────────────────────────────────────────
 * 📡 Generating sensor data...
 *    Vibration: MEDIUM (48.3%)
 *    GPS: Anna Salai, Chennai
 *    Speed: 35 km/h
 *    Camera Confidence: 71%
 * 🔧 Processing sensor data...
 *    ✓ No hazard detected
 * ═══════════════════════════════════════════════════════════
 * 
 * [2:45:33 PM] Sensor Reading #2
 * ────────────────────────────────────────
 * 📡 Generating sensor data...
 *    Vibration: HIGH (82.5%)
 *    GPS: Mylapore, Chennai
 *    Speed: 28 km/h
 *    Camera Confidence: 78%
 * 🔧 Processing sensor data...
 *    → Vibration detected: HIGH
 *    ✅ HAZARD DETECTED → Type: Pothole | Severity: HIGH
 * 
 * 📲 FRONT-END UI UPDATE
 *    Adding hazard to dashboard: Pothole
 * 
 * 📲 ADMIN DASHBOARD: Real-time hazard update
 *    Adding to admin dashboard: Pothole
 * 🚨 UI UPDATE TRIGGERED
 *    → New hazard added to dashboard
 *    → Notification: Pothole - HIGH severity
 *    → Location: Mylapore, Chennai
 * ═══════════════════════════════════════════════════════════
 * 
 * 
 * ========================================
 * CONFIGURATION
 * ========================================
 * 
 * SENSOR INTERVAL:
 * └─ Default: 2500ms (2.5 seconds)
 * └─ To change: Pass interval as 3rd parameter to useSensorSimulation()
 * └─ Example: useSensorSimulation(callback, 3000, true) // 3 seconds
 * 
 * LOCATION POOL:
 * └─ 8 mock Chennai locations (can be expanded in sensorSimulation.js)
 * └─ Each reading picks random location with slight GPS variation
 * 
 * HAZARD TYPE DISTRIBUTION:
 * └─ Pothole: 35% probability
 * └─ Speedbump: 25%
 * └─ Flooding: 15%
 * └─ Road Debris: 15%
 * └─ Crack: 10%
 * 
 * VIBRATION THRESHOLDS:
 * └─ HIGH: > 0.85 (with high camera confidence)
 * └─ MEDIUM: 0.75 - 0.85
 * └─ LOW: < 0.75
 * └─ Hazard detection threshold: vibration > 0.65
 * 
 * 
 * ========================================
 * VISUAL INDICATORS
 * ========================================
 * 
 * LIVE SENSOR STATUS BADGE:
 * └─ Location: Top of both SensorData and AdminDashboard pages
 * └─ Shows: "Live Sensor: ACTIVE" (when simulation is running)
 * └─ Animation: Pulsing green dot (pulses every 2 seconds)
 * └─ Color: Green (#22c55e) - indicates active monitoring
 * 
 * LIVE HAZARD STATS:
 * └─ Location: Below status badge
 * └─ Shows:
 *    • Hazards Detected (Live): running count
 *    • Last Detection: timestamp of most recent hazard
 *    • Total Reports: cumulative total
 * 
 * AUTO-DETECTED BADGE:
 * └─ Location: Next to each hazard in reports list
 * └─ Shows: "📡 Auto-Detected" for sensor-generated hazards
 * └─ Color: Blue background (matches theme)
 * └─ User-submitted: "✅ Submitted" (for comparison)
 * 
 * TOAST NOTIFICATIONS:
 * └─ Triggered: When hazard detected
 * └─ Shows: "🚨 {HazardType} detected! Severity: {Severity}"
 * └─ Duration: 3 seconds (auto-dismisses)
 * 
 * 
 * ========================================
 * DEMO SCRIPT
 * ========================================
 * 
 * When demoing to stakeholders:
 * 
 * 1. OPEN BROWSER CONSOLE (F12 → Console tab)
 *    └─ This shows the sensor simulation logs
 * 
 * 2. OPEN SENSORDATA PAGE (or Admin Dashboard)
 *    └─ Note the "Live Sensor: ACTIVE" indicator
 *    └─ Pulsing green dot indicates continuous monitoring
 * 
 * 3. WATCH CONSOLE
 *    └─ Every 2.5 seconds, a new "Sensor Reading" log appears
 *    └─ Shows sensor data generation
 *    └─ Shows processing logic
 * 
 * 4. WATCH DASHBOARD
 *    └─ When hazard detected (about 40% of readings):
 *       • New hazard appears at top of list
 *       • "Live Detections" counter increments
 *       • "Last Detection" timestamp updates
 *       • Toast notification appears ("🚨 Pothole detected! Severity: HIGH")
 * 
 * 5. POINT OUT SENSOR ATTRIBUTION
 *    └─ Hazards show "📡 Auto-Detected" badge
 *    └─ Reporter listed as "System (Sensor)"
 *    └─ Demonstrates sensor → processing → dashboard pipeline
 * 
 * 6. CHECK ADMIN DASHBOARD
 *    └─ Same hazards appear in real-time for admin monitoring
 *    └─ Shows both user reports and sensor detections
 *    └─ Demonstrates unified data pipeline
 * 
 * 
 * ========================================
 * KEY FEATURES
 * ========================================
 * 
 * ✅ NO MANUAL REFRESH: UI updates automatically
 * ✅ NO BUTTON CLICKS: Runs on schedule automatically
 * ✅ CONTINUOUS STREAM: Runs every 2-3 seconds
 * ✅ REALISTIC DATA: Mock data mimics real sensors
 * ✅ HAZARD DETECTION LOGIC: Applies realistic rules
 * ✅ CONSOLE LOGGING: Full transparency for demos
 * ✅ VISUAL INDICATORS: Live status badges and animations
 * ✅ NOTIFICATIONS: Toast alerts on detection
 * ✅ INTEGRATED: Works with existing UI/state management
 * ✅ NO BACKEND CHANGES: Pure frontend simulation
 * ✅ SCALABLE: Easy to adjust interval, locations, hazard types
 * ✅ DEMO-READY: Console logs provide complete visibility
 * 
 * 
 * ========================================
 * TECHNICAL IMPLEMENTATION DETAILS
 * ========================================
 * 
 * REACT HOOKS USED:
 * └─ useEffect: Lifecycle management
 * └─ useState: State management (hazard count, last time, etc.)
 * └─ useCallback: Memoized callback functions
 * └─ useRef: Persistent cleanup function reference
 * 
 * STATE MANAGEMENT:
 * └─ AppContext: addReport() adds hazards to global reports state
 * └─ Local component state: Tracks sensor stream status, counts, times
 * └─ No additional state management library needed
 * 
 * CLEANUP & PERFORMANCE:
 * └─ setInterval properly cleaned up on unmount
 * └─ Prevents memory leaks and duplicate simulations
 * └─ useSensorSimulation hook handles all cleanup
 * 
 * ANIMATION:
 * └─ CSS keyframe animation for pulsing indicator
 * └─ Non-blocking, efficient animation
 * └─ Provides visual "live" feedback
 * 
 * 
 * ========================================
 * FUTURE ENHANCEMENTS
 * ========================================
 * 
 * POTENTIAL ADDITIONS:
 * 
 * 1. WebSocket integration
 *    └─ Replace simulated data with real sensor stream
 *    └─ Same UI/logic, different data source
 * 
 * 2. Advanced filtering
 *    └─ Filter by hazard type, severity, location
 *    └─ Heat maps of hazard zones
 * 
 * 3. Playback controls
 *    └─ Pause/resume simulation
 *    └─ Speed up/slow down simulation
 *    └─ Record and replay scenarios
 * 
 * 4. Mobile integration
 *    └─ Same simulation system for React Native
 *    └─ Unified demo across platforms
 * 
 * 5. Data persistence
 *    └─ Save simulated hazards to database
 *    └─ Replay saved sessions
 * 
 * 
 * ========================================
 * USAGE IN COMPONENTS
 * ========================================
 * 
 * BASIC USAGE:
 * 
 * import { useSensorSimulation } from '../hooks/useSensorSimulation.js';
 * 
 * function MyComponent() {
 *   const handleHazardDetected = (hazard) => {
 *     // Do something with hazard
 *     addReport(hazard);
 *   };
 * 
 *   useSensorSimulation(handleHazardDetected, 2500, true);
 *   
 *   return (
 *     <div>
 *       {/* Component UI */}
 *     </div>
 *   );
 * }
 * 
 * 
 * ADVANCED USAGE (with controls):
 * 
 * function AdvancedComponent() {
 *   const [simulationEnabled, setSimulationEnabled] = useState(true);
 *   
 *   const handleHazardDetected = (hazard) => {
 *     // Custom logic
 *   };
 * 
 *   const { isRunning, start, stop } = useSensorSimulation(
 *     handleHazardDetected,
 *     2500,
 *     simulationEnabled
 *   );
 * 
 *   return (
 *     <div>
 *       {isRunning ? 'Simulation Running' : 'Stopped'}
 *       <button onClick={start}>Start</button>
 *       <button onClick={stop}>Stop</button>
 *     </div>
 *   );
 * }
 * 
 * 
 * ========================================
 * TESTING
 * ========================================
 * 
 * TO TEST THE SYSTEM:
 * 
 * 1. Start the frontend:
 *    $ cd frontend/dashboard
 *    $ npm run dev
 * 
 * 2. Open browser and navigate to app
 * 
 * 3. Open browser console (F12)
 * 
 * 4. Go to SensorData or Admin Dashboard page
 *    (Sensor simulation auto-starts)
 * 
 * 5. Watch console logs showing:
 *    - Sensor reading timestamps
 *    - Vibration levels
 *    - GPS locations
 *    - Hazard detections (when they occur)
 *    - UI update notifications
 * 
 * 6. Watch dashboard:
 *    - New hazards appear every ~20-30 seconds
 *    - Counters update
 *    - Toast notifications appear
 *    - "Live Sensor: ACTIVE" indicator shows pulsing dot
 * 
 * 7. To stop: Close component/page (cleanup function runs)
 * 
 * 
 * ========================================
 * TROUBLESHOOTING
 * ========================================
 * 
 * Q: No console logs appearing?
 * A: 1. Check browser console is open (F12)
 *    2. Make sure you're on SensorData or AdminDashboard page
 *    3. Check component mounted (no errors in console)
 * 
 * Q: Simulation not starting automatically?
 * A: 1. Check useSensorSimulation enabled parameter is true
 *    2. Verify hook is imported correctly
 *    3. Check for any React errors in console
 * 
 * Q: Hazards not appearing on dashboard?
 * A: 1. Check addReport callback is working
 *    2. Verify AppContext is provided
 *    3. Check if hazards are being filtered/hidden
 * 
 * Q: Animation not showing?
 * A: 1. Check browser supports CSS animations
 *    2. Verify sensorStreamActive state is true
 *    3. Check <style> tag is in JSX
 * 
 * 
 * ========================================
 * SUPPORT & DOCUMENTATION
 * ========================================
 * 
 * For questions or issues:
 * 1. Check console logs for detailed error messages
 * 2. Review sensor reading logs to understand data flow
 * 3. Verify all files created are in correct locations
 * 4. Ensure imports are correct in components
 * 5. Check AppContext is properly configured
 */
