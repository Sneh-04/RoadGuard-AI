import { useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { classNames } from '../utils/helpers.js';

const badges = [
  { title: 'First Report', subtitle: 'First time sharing a hazard', unlocked: true },
  { title: 'Road Warrior', subtitle: '10+ reports submitted', unlocked: false },
  { title: 'Community Helper', subtitle: '5+ verifications', unlocked: false },
  { title: 'Top Reporter', subtitle: 'Featured in a community alert', unlocked: false },
];

export default function Profile() {
  const { user, stats, apiBase, logout, updateApiBase, updateSettings, settings } = useAppContext();
  const [localApi, setLocalApi] = useState(apiBase);

  const handleSaveApi = () => {
    updateApiBase(localApi);
  };

  return (
    <main style={{ padding: 20, background: '#021c1a' }}>
      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: '#00C9A7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#060D0D', fontSize: 24, fontWeight: 600 }}>{user?.avatar ? <img style={{ width: '100%', height: '100%', borderRadius: 32 }} src={user.avatar} alt="Profile" /> : user?.fullName?.charAt(0)}</div>
          <div>
            <h1 style={{ fontSize: 24, color: '#E8FFF8', margin: 0 }}>{user?.fullName}</h1>
            <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0' }}>{user?.email} • {user?.phone}</p>
            <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0' }}>{user?.city} • {user?.vehicle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,201,167,0.1)', borderRadius: 12, padding: 12 }}>
          <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: 18, color: '#00C9A7' }}>{stats.reportCount}</strong><span style={{ fontSize: 12, color: '#7EB8A8' }}>Reports</span></div>
          <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: 18, color: '#00C9A7' }}>{stats.activeReports}</strong><span style={{ fontSize: 12, color: '#7EB8A8' }}>Active</span></div>
          <div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: 18, color: '#00C9A7' }}>{stats.helpedUsers}</strong><span style={{ fontSize: 12, color: '#7EB8A8' }}>Users helped</span></div>
        </div>
      </div>

      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Achievement Badges</p>
            <h2 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>Your milestone progress</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {badges.map((badge) => (
            <div key={badge.title} style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:12, textAlign: 'center', opacity: badge.unlocked ? 1 : 0.5 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{badge.unlocked ? '🏅' : '🔒'}</div>
              <p style={{ fontSize: 14, color: '#E8FFF8', margin: 0 }}>{badge.title}</p>
              <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0' }}>{badge.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Settings</p>
            <h2 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>Manage your RoadGuard profile</h2>
          </div>
        </div>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: '#E8FFF8' }}>Notifications</span>
          <button type="button" style={{ padding: '4px 12px', background: settings.notifications ? '#00C9A7' : '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 12 }} onClick={() => updateSettings({ notifications: !settings.notifications })}>
            {settings.notifications ? 'On' : 'Off'}
          </button>
        </label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: '#E8FFF8' }}>Dark Mode</span>
          <button type="button" style={{ padding: '4px 12px', background: settings.darkMode ? '#00C9A7' : '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 12 }} onClick={() => updateSettings({ darkMode: !settings.darkMode })}>
            {settings.darkMode ? 'On' : 'Off'}
          </button>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <label style={{ fontSize: 14, color: '#E8FFF8', fontWeight: 600 }}>Backend URL</label>
          <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#E8FFF8' }} value={localApi} onChange={(e) => setLocalApi(e.target.value)} />
        </div>
        <button type="button" style={{ padding: 12, background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 8 }} onClick={handleSaveApi}>Update API URL</button>
        <button type="button" style={{ padding: 12, background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 8 }} onClick={() => { localStorage.removeItem('roadguard_v1'); window.location.reload(); }}>
          Clear Cache
        </button>
        <button type="button" style={{ padding: 12, background: '#00C9A7', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 16 }} onClick={logout}>Logout</button>
        <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid rgba(0,201,167,0.15)' }}>
          <p style={{ fontSize: 12, color: '#7EB8A8' }}>App version 1.0.0 · For research demo and hackathon presentation.</p>
        </div>
      </div>
    </main>
  );
}
