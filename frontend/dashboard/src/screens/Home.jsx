import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { getGreeting, formatDate } from '../utils/helpers.js';
import WeatherWidget from '../components/WeatherWidget.jsx';
import HazardCard from '../components/HazardCard.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import StatCard from '../components/StatCard.jsx';

const hazardIcons = {
  Pothole: '🕳️',
  Speedbump: '⚠️',
  Flooding: '🌊',
  Crack: '🔧',
};

export default function Home({ onNavigate }) {
  const { user, reports, congestion, alerts, stats } = useAppContext();

  const greeting = getGreeting();
  const today = formatDate(new Date().toISOString());

  const nearby = useMemo(() => reports.slice(0, 3), [reports]);

  return (
    <main style={{ padding: 20, background: '#021c1a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 14, color: '#7dd3c7', margin: 0 }}>{today}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e6fffa', margin: 0 }}>{greeting}, {user?.fullName.split(' ')[0]} 👋</h1>
          <p style={{ fontSize: 16, color: '#7dd3c7', margin: '8px 0 0 0' }}>{user?.city || 'Your city'}, premium road insights for your next ride.</p>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: '#00c9a7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#021c1a', fontSize: 20, fontWeight: 600 }}>{user?.avatar ? <img style={{ width: '100%', height: '100%', borderRadius: 24 }} src={user.avatar} alt="Profile" /> : user?.fullName?.charAt(0)}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <WeatherWidget weather={{
            current: 'Rainy',
            temperature: 24,
            humidity: 84,
            windSpeed: 11,
            summary: 'Slippery Roads ⚠️',
            icon: '🌧️',
          }} />
          <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 14, color: '#7dd3c7', margin: 0 }}>Congestion Nearby</p>
                <h2 style={{ fontSize: 18, color: '#e6fffa', margin: 0 }}>Live traffic hotspots</h2>
              </div>
              <button type="button" style={{ background: 'none', border: 'none', color: '#00c9a7', cursor: 'pointer', fontSize: 14 }} onClick={onNavigate}>View on Map</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {congestion.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#e6fffa' }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: '#7dd3c7' }}>Delay {item.delay}</p>
                  </div>
                  <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: item.color + '20', color: item.color }}>{item.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, color: '#7dd3c7', margin: 0 }}>Hazards Near You</p>
              <h2 style={{ fontSize: 18, color: '#e6fffa', margin: 0 }}>Detected threats ahead</h2>
            </div>
            <button type="button" style={{ background: 'none', border: 'none', color: '#00c9a7', cursor: 'pointer', fontSize: 14 }}>See All</button>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {nearby.map((hazard) => (
              <div key={hazard.id} style={{ minWidth: 200, flexShrink: 0, background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{hazardIcons[hazard.type] || '⚠️'}</span>
                  <SeverityBadge value={hazard.severity} />
                </div>
                <h3 style={{ fontSize: 16, color: '#e6fffa', margin: 0 }}>{hazard.type}</h3>
                <p style={{ fontSize: 14, color: '#7dd3c7', margin: '4px 0' }}>{hazard.location.address}</p>
                <p style={{ fontSize: 12, color: '#7dd3c7', margin: '4px 0' }}>{(hazard.distance ?? 0).toFixed(1)} km away • {hazard.reporter}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, color: '#7dd3c7', margin: 0 }}>Community Alerts</p>
              <h2 style={{ fontSize: 18, color: '#e6fffa', margin: 0 }}>Latest reports</h2>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, color: '#e6fffa' }}>{alert.title}</p>
                  <p style={{ fontSize: 12, color: '#7dd3c7' }}>{alert.description}</p>
                </div>
                <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#00c9a7', color: '#021c1a' }}>+{alert.votes}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <StatCard title="Hazards Near You" value={stats.totalHazards} subtitle="Within 5km" accent="#ef4444" />
            <StatCard title="Active Reports Today" value={stats.activeReports} subtitle="Live community feed" accent="#f59e0b" />
            <StatCard title="Roads Cleared" value={stats.roadsCleared} subtitle="Verified safe" accent="#10b981" />
          </div>
        </section>
      </div>
    </main>
  );
}
