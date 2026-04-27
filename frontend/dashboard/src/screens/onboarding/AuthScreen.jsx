import { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { classNames } from '../../utils/helpers.js';

const vehicleOptions = ['Car', 'Bike', 'Truck', 'Auto', 'Bus'];

export default function AuthScreen({ onSuccess }) {
  const { signUp, login } = useAppContext();
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    vehicle: 'Car',
    password: '',
    confirmPassword: '',
    terms: false,
    avatar: null,
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.terms) {
      setError('Please accept the terms to continue.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      signUp(form);
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      login(loginForm);
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField('avatar', reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <main style={{ height: '100vh', width: '100vw', background: '#060D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 14, color: '#7dd3c7', margin: 0 }}>RoadGuard</p>
              <h1 style={{ fontSize: 24, color: '#e0e7ff', margin: '4px 0 0 0' }}>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                style={{ padding: '8px 16px', background: mode === 'register' ? '#00c9a7' : 'rgba(0,201,167,0.06)', color: mode === 'register' ? '#021c1a' : '#7dd3c7', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setMode('register')}
              >
                Register
              </button>
              <button
                type="button"
                style={{ padding: '8px 16px', background: mode === 'login' ? '#00c9a7' : 'rgba(0,201,167,0.06)', color: mode === 'login' ? '#021c1a' : '#7dd3c7', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setMode('login')}
              >
                Login
              </button>
            </div>
          </div>

          {mode === 'register' ? (
            <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleRegister}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Full Name</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Snehalatha Reddy" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Email Address</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={form.email} onChange={(e) => updateField('email', e.target.value)} type="email" placeholder="hello@roadguard.ai" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Phone Number</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} type="tel" placeholder="+91 98765 43210" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>City / Region</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Chennai" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Vehicle Type</label>
                <select style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={form.vehicle} onChange={(e) => updateField('vehicle', e.target.value)}>
                  {vehicleOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Profile Photo</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} type="file" accept="image/*" onChange={handleAvatar} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Password</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={form.password} onChange={(e) => updateField('password', e.target.value)} type="password" placeholder="Create a strong password" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Confirm Password</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} type="password" placeholder="Retype password" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#7dd3c7', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.terms} onChange={(e) => updateField('terms', e.target.checked)} />
                  I agree to the Terms & Conditions
                </label>
              </div>
              {error && <p style={{ color: '#FF5F6D', fontSize: 14, margin: 0 }}>{error}</p>}
              <button type="submit" style={{ padding: 16, background: '#00c9a7', color: '#021c1a', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>Create Account</button>
            </form>
          ) : (
            <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleLogin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Email Address</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={loginForm.email} onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))} type="email" placeholder="hello@roadguard.ai" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>Password</label>
                <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e0e7ff' }} value={loginForm.password} onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))} type="password" placeholder="Enter your password" />
              </div>
              <button type="button" style={{ background: 'none', border: 'none', color: '#00c9a7', cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start' }}>Forgot Password?</button>
              {error && <p style={{ color: '#FF5F6D', fontSize: 14, margin: 0 }}>{error}</p>}
              <button type="submit" style={{ padding: 16, background: '#00c9a7', color: '#021c1a', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>Login</button>
              <div style={{ textAlign: 'center', color: '#7dd3c7', fontSize: 14, margin: '16px 0', position: 'relative' }}>or</div>
              <button type="button" style={{ padding: 12, background: '#00c9a7', color: '#021c1a', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Continue with Google</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
