import { useState } from 'react';
import { classNames } from '../../utils/helpers.js';

const ADMIN_EMAIL = 'admin@roadguard.in';
const ADMIN_PASSWORD = 'roadguard@admin2024';

export default function AdminLogin({ onSuccess, onBack }) {
  const [email, setEmail] = useState('admin@roadguard.in');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError('Incorrect admin credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }

    localStorage.setItem('roadguard_admin_session', 'true');
    onSuccess('true');
  };

  return (
    <main style={{ height: '100vh', width: '100vw', background: '#060D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:24, animation: shake ? 'shake 0.3s ease' : 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ background: '#9B59B6', color: '#060D0D', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Admin Console</span>
          <h1 style={{ fontSize: 28, color: '#E8FFF8', margin: '8px 0' }}>RoadGuard</h1>
          <p style={{ color: '#7EB8A8', fontSize: 14 }}>Secure admin access to analytics and report operations.</p>
        </div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#E8FFF8', fontWeight: 600 }}>Email Address</span>
            <input
              style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#E8FFF8' }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@roadguard.in"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#E8FFF8', fontWeight: 600 }}>Password</span>
            <input
              style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#E8FFF8' }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>
          {error && <p style={{ color: '#FF5F6D', fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" style={{ padding: 16, background: '#9B59B6', color: '#060D0D', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>Sign In</button>
          <button type="button" style={{ padding: 12, background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={onBack}>
            ← Back to Role Select
          </button>
        </form>
      </div>
    </main>
  );
}
