import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import StatCard from '../components/StatCard.jsx';

export default function SensorData() {
  const { user, reports, stats } = useAppContext();
  const [liveSpeed, setLiveSpeed] = useState(26);
  const [liveAccuracy, setLiveAccuracy] = useState(9);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSpeed(Math.round(Math.random() * 24 + 22));
      setLiveAccuracy(Math.round(Math.random() * 4 + 7));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // User-specific data
  const userReports = useMemo(() => reports.filter(r => r.reporter === user?.fullName), [reports, user]);
  const roadsTraveled = Math.round(Math.random() * 50 + 20); // Mock
  const hazardsEncountered = userReports.length;
  const safetyScore = Math.round(Math.random() * 20 + 75); // Mock
  const communityImpact = stats.helpedUsers || 0;

  return (
    <main style={{ padding: 20, background: '#060D0D' }}>
      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>My Activity</p>
          <h2 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>Your road safety journey</h2>
        </div>
        <div style={{ padding: '4px 12px', background: '#00C9A7', color: '#060D0D', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Active</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <StatCard title="Roads Traveled Today" value={`${roadsTraveled} km`} accent="#00C9A7" />
        <StatCard title="Hazards Encountered" value={hazardsEncountered} accent="#00E5CC" />
        <StatCard title="Reports Submitted" value={userReports.length} accent="#00F5A0" />
        <StatCard title="Safety Score" value={`${safetyScore}/100`} accent="#FFB347" />
      </div>

      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Recent Reports</p>
            <h2 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>Your contributions</h2>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {userReports.slice(0, 5).map((report) => (
            <div key={report.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, color: '#E8FFF8' }}>{report.type} reported</p>
                <p style={{ fontSize: 12, color: '#7EB8A8' }}>{report.location.city} • {new Date(report.timestamp).toLocaleDateString()}</p>
              </div>
              <span style={{ padding: '4px 8px', background: '#00C9A7', color: '#060D0D', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>✅ Submitted</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Community Impact</p>
          <h3 style={{ fontSize: 24, color: '#E8FFF8', margin: 0 }}>{communityImpact}</h3>
          <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0 0 0' }}>Users helped by your reports</p>
        </div>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Trip History</p>
          <h3 style={{ fontSize: 24, color: '#E8FFF8', margin: 0 }}>{Math.round(roadsTraveled * 0.8)} km</h3>
          <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0 0 0' }}>This week total</p>
        </div>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.06)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Best Route</p>
          <h3 style={{ fontSize: 24, color: '#E8FFF8', margin: 0 }}>{stats.dangerousRoad}</h3>
          <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0 0 0' }}>Your safest path</p>
        </div>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Next Trip</p>
          <h3 style={{ fontSize: 24, color: '#E8FFF8', margin: 0 }}>{stats.bestTime}</h3>
          <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0 0 0' }}>Recommended time</p>
        </div>
      </div>
    </main>
  );
}
