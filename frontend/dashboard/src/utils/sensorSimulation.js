/**
 * REAL-TIME SENSOR SIMULATION SYSTEM
 * ====================================
 * Simulates real hardware sensors (camera, vibration, GPS) feeding continuous data.
 * This module generates realistic mock sensor data and processes it for hazard detection.
 */

// Mock GPS coordinates for various locations in Chennai
const mockLocations = [
  { city: 'Chennai', address: 'Anna Salai', latitude: 13.0827, longitude: 80.2707 },
  { city: 'Adyar', address: 'Opposite Lagoon', latitude: 13.0107, longitude: 80.2444 },
  { city: 'Mylapore', address: 'Kapaleeshwarar Temple', latitude: 13.0332, longitude: 80.2714 },
  { city: 'Besant Nagar', address: 'Bessie', latitude: 12.9918, longitude: 80.2501 },
  { city: 'Velachery', address: 'IT Corridor', latitude: 12.9689, longitude: 80.2253 },
  { city: 'Nungambakkam', address: 'Housing Board', latitude: 13.0558, longitude: 80.2426 },
  { city: 'Egmore', address: 'Central Station', latitude: 13.1567, longitude: 80.2449 },
  { city: 'Purasawalkam', address: 'High Road', latitude: 13.1405, longitude: 80.2404 },
];

// Hazard types and their characteristics
const hazardTypes = [
  { type: 'Pothole', probability: 0.35 },
  { type: 'Speedbump', probability: 0.25 },
  { type: 'Flooding', probability: 0.15 },
  { type: 'Road Debris', probability: 0.15 },
  { type: 'Crack', probability: 0.10 },
];

/**
 * Generate realistic mock sensor data
 * Simulates camera, vibration, and GPS sensors
 * @returns {Object} Sensor data object
 */
export function generateSensorData() {
  const vibrationLevel = Math.random();
  const vibrationStrength = vibrationLevel < 0.5 ? 'LOW' : vibrationLevel < 0.8 ? 'MEDIUM' : 'HIGH';
  
  const gpsLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
  const confidenceScore = Math.round((Math.random() * 30 + 60)) / 100; // 0.60-0.90
  
  return {
    timestamp: new Date().toISOString(),
    vibration: {
      level: vibrationLevel, // 0-1
      strength: vibrationStrength,
      accelerationX: (Math.random() - 0.5) * 10,
      accelerationY: (Math.random() - 0.5) * 10,
      accelerationZ: (Math.random() - 0.5) * 10,
    },
    gps: {
      latitude: gpsLocation.latitude + (Math.random() - 0.5) * 0.01,
      longitude: gpsLocation.longitude + (Math.random() - 0.5) * 0.01,
      location: gpsLocation,
      speed: Math.round(Math.random() * 60 + 20), // 20-80 km/h
    },
    camera: {
      frameId: Math.floor(Math.random() * 10000),
      brightness: Math.round(Math.random() * 100),
      contrast: Math.round(Math.random() * 100),
      detectionConfidence: confidenceScore,
    },
  };
}

/**
 * Process sensor data and detect hazards
 * Applies business logic to determine if hazard is present
 * @param {Object} sensorData - Raw sensor data from generateSensorData()
 * @returns {Object|null} Hazard object if detected, null otherwise
 */
export function processSensorData(sensorData) {
  console.log('🔧 Processing sensor data...');
  
  // Rule 1: High vibration indicates potential hazard
  if (sensorData.vibration.level > 0.65) {
    console.log(`  → Vibration detected: ${sensorData.vibration.strength}`);
    
    // Determine severity based on vibration level and confidence
    let severity = 'Low';
    if (sensorData.vibration.level > 0.85 && sensorData.camera.detectionConfidence > 0.75) {
      severity = 'High';
    } else if (sensorData.vibration.level > 0.75 || sensorData.camera.detectionConfidence > 0.70) {
      severity = 'Medium';
    }
    
    // Randomly select a hazard type
    const selectedHazard = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
    
    const hazard = {
      id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: selectedHazard.type,
      severity,
      confidence: Math.round(sensorData.camera.detectionConfidence * 100) / 100,
      distance: Math.round((Math.random() * 2 + 0.2) * 10) / 10, // 0.2-2.2 km
      location: sensorData.gps.location,
      latitude: sensorData.gps.latitude,
      longitude: sensorData.gps.longitude,
      timestamp: sensorData.timestamp,
      reporter: 'System (Sensor)', // From autonomous sensor
      status: 'Pending',
      votes: 0,
      sensorId: 'SENSOR_001',
      vibrationStrength: sensorData.vibration.strength,
    };
    
    console.log(`  ✅ HAZARD DETECTED → Type: ${hazard.type} | Severity: ${hazard.severity}`);
    return hazard;
  }
  
  // No hazard detected in this cycle
  console.log('  ✓ No hazard detected');
  return null;
}

/**
 * Main sensor simulation loop
 * Generates data, processes it, and triggers UI updates
 * @param {Function} onHazardDetected - Callback when hazard is detected
 * @param {number} interval - Milliseconds between sensor readings (default: 2500ms)
 * @returns {Function} Cleanup function to stop simulation
 */
export function startSensorSimulation(onHazardDetected, interval = 2500) {
  console.log('🚀 REAL-TIME SENSOR SIMULATION STARTED');
  console.log(`   Interval: ${interval}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let simulationCount = 0;
  
  const simulationLoop = setInterval(() => {
    simulationCount++;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n[${timestamp}] Sensor Reading #${simulationCount}`);
    console.log('────────────────────────────────────────');
    
    // Step 1: Generate raw sensor data
    console.log('📡 Generating sensor data...');
    const sensorData = generateSensorData();
    console.log(`   Vibration: ${sensorData.vibration.strength} (${(sensorData.vibration.level * 100).toFixed(1)}%)`);
    console.log(`   GPS: ${sensorData.gps.location.address}, ${sensorData.gps.location.city}`);
    console.log(`   Speed: ${sensorData.gps.speed} km/h`);
    console.log(`   Camera Confidence: ${(sensorData.camera.detectionConfidence * 100).toFixed(0)}%`);
    
    // Step 2: Process data
    const hazard = processSensorData(sensorData);
    
    // Step 3: Update UI if hazard detected
    if (hazard) {
      console.log(`\n🚨 UI UPDATE TRIGGERED`);
      console.log(`   → New hazard added to dashboard`);
      console.log(`   → Notification: ${hazard.type} - ${hazard.severity} severity`);
      console.log(`   → Location: ${hazard.location.address}, ${hazard.location.city}`);
      onHazardDetected(hazard);
    }
    
    console.log('═══════════════════════════════════════════════════════════');
  }, interval);
  
  // Return cleanup function
  return () => {
    clearInterval(simulationLoop);
    console.log('\n⛔ SENSOR SIMULATION STOPPED');
  };
}

/**
 * Get random hazard for initial demo
 * Useful for showing at least one hazard on startup
 * @returns {Object} Hazard object
 */
export function generateInitialHazard() {
  const sensorData = generateSensorData();
  sensorData.vibration.level = 0.8; // Force high vibration
  return processSensorData(sensorData);
}
