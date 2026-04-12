import { useState } from 'react';
import { testConnection } from '../utils/api.js';
import { useAdminContext } from '../context/AdminContext.jsx';

export default function Settings() {
  const { apiBase, updateApiBase, admin, showToast } = useAdminContext();
  const [endpoint, setEndpoint] = useState(apiBase);
  const [status, setStatus] = useState(null);

  const handleTest = async () => {
    setStatus('checking');
    try {
      const result = await testConnection(endpoint);
      setStatus('online');
      showToast(`Connected successfully in ${result.latency}ms`, 'success');
    } catch (err) {
      setStatus('offline');
      showToast(err.message || 'Connection failed', 'danger');
    }
  };

  const handleSave = (event) => {
    event.preventDefault();
    updateApiBase(endpoint);
  };

  return (
    <div className="page-settings">
      <div className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Application configuration</h2>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card settings-card">
          <div className="card-title">Backend API endpoint</div>
          <form onSubmit={handleSave}>
            <label>
              API base URL
              <input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://your-ngrok-url" />
            </label>
            <div className="settings-actions">
              <button type="button" className="secondary-button" onClick={handleTest}>Test connection</button>
              <button type="submit" className="primary-button">Save endpoint</button>
            </div>
            {status && <p className={`connection-status ${status}`}>Status: {status === 'checking' ? 'Checking...' : status === 'online' ? 'Online' : 'Offline'}</p>}
          </form>
        </div>

        <div className="card settings-card">
          <div className="card-title">Admin account</div>
          <div className="account-detail">
            <span>Name</span>
            <strong>{admin?.name || 'RoadGuard Admin'}</strong>
          </div>
          <div className="account-detail">
            <span>Email</span>
            <strong>admin@roadguard.in</strong>
          </div>
          <div className="account-detail">
            <span>Role</span>
            <strong>Administrator</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
