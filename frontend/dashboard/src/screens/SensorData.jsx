import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import StatCard from '../components/StatCard.jsx';
import { useSensorSimulation } from '../hooks/useSensorSimulation.js';

export default function SensorData() {
  const { user, reports, stats, addReport, setShowToast } = useAppContext();
  const [liveSpeed, setLiveSpeed] = useState(26);
  const [liveAccuracy, setLiveAccuracy] = useState(9);
  const [sensorStreamActive, setSensorStreamActive] = useState(false);
  const [lastHazardTime, setLastHazardTime] = useState(null);
  const [hazardCount, setHazardCount] = useState(0);

  // 🚀 REAL-TIME SENSOR SIMULATION INTEGRATION
  const handleHazardDetected = (hazard) => {
    console.log('\n📲 FRONT-END UI UPDATE');
    console.log(`   Adding hazard to dashboard: ${hazard.type}`);
    
    // Add hazard to reports
    addReport({
      type: hazard.type,
      severity: hazard.severity,
      confidence: hazard.confidence,
      location: hazard.location,
      latitude: hazard.latitude,
      longitude: hazard.longitude,
      description: `Real-time sensor detection: ${hazard.type} at ${hazard.location.address}`,
      reporter: hazard.reporter,
      status: hazard.status,
    });
    
    // Update UI state
    setLastHazardTime(new Date());
    setHazardCount(prev => prev + 1);
    
    // Show toast notification
    setShowToast(`🚨 ${hazard.type} detected! Severity: ${hazard.severity}`);
  };

  // Start sensor simulation on component mount
  useSensorSimulation(handleHazardDetected, 2500, true);

  useEffect(() => {
    setSensorStreamActive(true);
    
    // Simulate live speed and accuracy updates
    const interval = setInterval(() => {
      setLiveSpeed(Math.round(Math.random() * 24 + 22));
      setLiveAccuracy(Math.round(Math.random() * 4 + 7));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // User-specific data
  const userReports = useMemo(() => reports.filter(r => r.reporter === user?.fullName || r.reporter === 'System (Sensor)'), [reports, user]);
  const roadsTraveled = Math.round(Math.random() * 50 + 20); // Mock
  const hazardsEncountered = userReports.length;
  const safetyScore = Math.round(Math.random() * 20 + 75); // Mock
  const communityImpact = stats.helpedUsers || 0;

  return (
    <main style={{ padding: 20, background: '#060D0D' }}>
      {/* 🟢 LIVE SENSOR STREAM INDICATOR */}
      <div style={{ 
        background: 'rgba(37,99,235,0.06)', 
        border: '1px solid rgba(37,99,235,0.15)', 
        borderRadius: 20, 
        padding: 18, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20,
        position: 'relative'
      }}>
        <div>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: 0 }}>My Activity</p>
          <h2 style={{ fontSize: 18, color: '#e0e7ff', margin: 0 }}>Your road safety journey</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Blinking indicator */}
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#22c55e',
            animation: 'pulse 2s infinite',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)',
          }} />
          <div style={{ padding: '4px 12px', background: '#2563eb', color: '#ffffff', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
            {sensorStreamActive ? 'Live Sensor: ACTIVE' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Hazard Detection Stats */}
      <div style={{ 
        background: 'rgba(37,99,235,0.06)', 
        border: '1px solid rgba(37,99,235,0.15)', 
        borderRadius: 12, 
        padding: 12, 
        marginBottom: 20,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr'
      }}>
        <div>
          <p style={{ fontSize: 12, color: '#60a5fa', margin: '0 0 4px 0' }}>Hazards Detected (Live)</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#e0e7ff', margin: 0 }}>{hazardCount}</p>
        </div>
        <div>
          <p style={{ fontSize: 12, color: '#60a5fa', margin: '0 0 4px 0' }}>Last Detection</p>
          <p style={{ fontSize: 14, color: '#e0e7ff', margin: 0 }}>
            {lastHazardTime ? new Date(lastHazardTime).toLocaleTimeString() : 'Waiting...'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <StatCard title="Roads Traveled Today" value={`${roadsTraveled} km`} accent="#2563eb" />
        <StatCard title="Hazards Encountered" value={hazardsEncountered} accent="#3b82f6" />
        <StatCard title="Reports Submitted" value={userReports.length} accent="#60a5fa" />
        <StatCard title="Safety Score" value={`${safetyScore}/100`} accent="#FFB347" />
      </div>

      <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:20, padding:18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, color: '#60a5fa', margin: 0 }}>Recent Reports (including live detections)</p>
            <h2 style={{ fontSize: 18, color: '#e0e7ff', margin: 0 }}>Your contributions</h2>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {userReports.slice(0, 5).map((report) => (
            <div key={report.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, color: '#e0e7ff' }}>{report.type} reported</p>
                <p style={{ fontSize: 12, color: '#60a5fa' }}>{report.location.city} • {new Date(report.timestamp).toLocaleDateString()}</p>
              </div>
              <span style={{ padding: '4px 8px', background: report.reporter === 'System (Sensor)' ? '#3b82f6' : '#2563eb', color: '#ffffff', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                {report.reporter === 'System (Sensor)' ? '📡 Auto-Detected' : '✅ Submitted'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: 0 }}>Community Impact</p>
          <h3 style={{ fontSize: 24, color: '#e0e7ff', margin: 0 }}>{communityImpact}</h3>
          <p style={{ fontSize: 12, color: '#60a5fa', margin: '4px 0 0 0' }}>Users helped by your reports</p>
        </div>
        <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: 0 }}>Trip History</p>
          <h3 style={{ fontSize: 24, color: '#e0e7ff', margin: 0 }}>{Math.round(roadsTraveled * 0.8)} km</h3>
          <p style={{ fontSize: 12, color: '#60a5fa', margin: '4px 0 0 0' }}>This week total</p>
        </div>
        <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: 0 }}>Best Route</p>
          <h3 style={{ fontSize: 24, color: '#e0e7ff', margin: 0 }}>{stats.dangerousRoad}</h3>
          <p style={{ fontSize: 12, color: '#60a5fa', margin: '4px 0 0 0' }}>Your safest path</p>
        </div>
        <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: 0 }}>Next Trip</p>
          <h3 style={{ fontSize: 24, color: '#e0e7ff', margin: 0 }}>{stats.bestTime}</h3>
          <p style={{ fontSize: 12, color: '#60a5fa', margin: '4px 0 0 0' }}>Recommended time</p>
        </div>
      </div>
    </main>
  );
}
