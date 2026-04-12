import { useMemo, useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { adminMockReports, adminMockUsers, adminAnalytics } from '../../utils/mockData.js';
import { classNames, timeAgo } from '../../utils/helpers.js';

const tabs = [
  { key: 'overview', icon: '📊', label: 'Overview' },
  { key: 'reports', icon: '📋', label: 'Reports' },
  { key: 'users', icon: '👥', label: 'Users' },
  { key: 'analytics', icon: '📈', label: 'Analytics' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

const filterOptions = ['All', 'Pending', 'Resolved', 'Ignored'];
const severityOptions = ['All', 'High', 'Medium', 'Low'];

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState(adminMockReports);
  const [users] = useState(adminMockUsers);
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [toast, setToast] = useState('');
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('roadguard_api_url') || 'https://YOUR_NGROK_URL');
  const [passwordValue, setPasswordValue] = useState('');

  const recentReports = useMemo(() => reports.slice(0, 5), [reports]);
  const filteredReports = useMemo(() => reports.filter((item) => {
    const statusMatch = statusFilter === 'All' || item.status === statusFilter;
    const severityMatch = severityFilter === 'All' || item.severity === severityFilter;
    return statusMatch && severityMatch;
  }), [reports, statusFilter, severityFilter]);

  const handleAction = (id, action) => {
    setReports((current) => current.map((item) => {
      if (item.id !== id) return item;
      const nextStatus = action === 'resolve' ? 'Resolved' : 'Ignored';
      return { ...item, status: nextStatus };
    }));
    setToast(action === 'resolve' ? 'Report resolved ✅' : 'Report ignored');
    window.setTimeout(() => setToast(''), 2000);
  };

  const handleSaveApi = () => {
    localStorage.setItem('roadguard_api_url', apiUrl);
    setToast('API configuration saved.');
    window.setTimeout(() => setToast(''), 2000);
  };

  const handleLogout = () => {
    onLogout();
  };

  const renderOverview = () => (
    <div style={{ padding: 20, background: '#060D0D' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Total Reports</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#E8FFF8', margin: 0 }}>846</p>
          <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0 0 0' }}>↑12% today</p>
        </div>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Pending</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#E8FFF8', margin: 0 }}>124</p>
          <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0 0 0' }}>⚠️ needs attention</p>
        </div>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Resolved</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#E8FFF8', margin: 0 }}>692</p>
          <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0 0 0' }}>✅ this week</p>
        </div>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Active Users</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#E8FFF8', margin: 0 }}>1,240</p>
          <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0 0 0' }}>Live community</p>
        </div>
      </div>

      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Recent Reports</p>
            <h2 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>Latest admin activity</h2>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentReports.map((report) => (
            <div key={report.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, color: '#E8FFF8' }}>{report.type} • {report.location.address}</p>
                <p style={{ fontSize: 12, color: '#7EB8A8' }}>{report.reporter} · {timeAgo(report.timestamp)}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={{ padding: 8, background: '#00C9A7', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={() => handleAction(report.id, 'resolve')}>✅ Resolve</button>
                <button type="button" style={{ padding: 8, background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={() => handleAction(report.id, 'ignore')}>❌ Ignore</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Action Timeline</p>
            <h2 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>Recent admin operations</h2>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Resolved a report', 'Ignored a duplicate alert', 'Updated API URL', 'Reviewed user activity', 'Cleared old reports'].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#00C9A7' }} />
              <p style={{ color: '#E8FFF8' }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="screen-content">
      <div className="filter-row">
        <div className="filter-chips">
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={classNames('filter-chip', statusFilter === option && 'active')}
              onClick={() => setStatusFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          {severityOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={classNames('filter-chip', severityFilter === option && 'active')}
              onClick={() => setSeverityFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-report-list">
        {filteredReports.map((report) => (
          <div key={report.id} className={classNames('admin-report-card', report.status === 'Resolved' && 'resolved', report.status === 'Ignored' && 'ignored')}>
            <div className="admin-report-preview">
              <img className="hazard-thumb" src={report.image} alt={report.type} />
              <div className="hazard-info">
                <p className="bold">{report.type}</p>
                <p className="mini-text">{report.location.address} · {report.reporter}</p>
                <p className="mini-text">{timeAgo(report.timestamp)}</p>
              </div>
            </div>
            <div className="admin-report-meta">
              <span className={classNames('badge', report.status === 'Resolved' ? 'badge-resolved' : report.status === 'Ignored' ? 'badge-ignored' : 'badge-pending')}>
                {report.status}
              </span>
              <span className={classNames('badge', report.severity === 'High' ? 'badge-high' : report.severity === 'Medium' ? 'badge-medium' : 'badge-low')}>
                {report.severity}
              </span>
            </div>
            <div className="admin-report-actions">
              <button type="button" className="btn-secondary" onClick={() => { setSelectedReport(report); setShowDetail(true); }}>👁 View Details</button>
              <button type="button" className="btn-primary" onClick={() => handleAction(report.id, 'resolve')}>✅ SOLVE</button>
              <button type="button" className="btn-secondary" onClick={() => handleAction(report.id, 'ignore')}>❌ IGNORE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="screen-content">
      <div className="admin-subheader">
        <div>
          <p className="section-title">Users</p>
          <h2>Community members</h2>
        </div>
      </div>
      <div className="admin-user-list">
        {users.map((user) => (
          <div key={user.id} className="admin-user-card">
            <div className="admin-user-meta">
              <div className="avatar-badge">{user.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
              <div>
                <p className="bold">{user.fullName}</p>
                <p className="mini-text">{user.email}</p>
              </div>
            </div>
            <div className="admin-user-details">
              <span className="badge badge-pending">{user.vehicle}</span>
              <p className="mini-text">{user.city}</p>
              <p className="mini-text">Joined {user.joinDate}</p>
              <span className="badge badge-resolved">{user.reportsCount} reports</span>
            </div>
            <div className="admin-user-actions">
              <button type="button" className="btn-secondary">🚫 Suspend</button>
              <button type="button" className="btn-primary">👁 View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="screen-content">
      <div className="admin-analytics-grid stat-grid">
        <div className="stat-card">
          <p className="stat-label">Avg Resolution Time</p>
          <p className="stat-value">{adminAnalytics.avgResolutionHours} hrs</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Report Accuracy Rate</p>
          <p className="stat-value">{adminAnalytics.accuracyRate}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Community Engagement</p>
          <p className="stat-value">{adminAnalytics.engagementScore}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Peak Hour</p>
          <p className="stat-value">{adminAnalytics.peakHour}</p>
        </div>
      </div>
      <div className="chart-card card">
        <p className="section-title">Reports Over 7 Days</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={adminAnalytics.weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: '#0b1120', border: '1px solid #273449' }} />
            <Area type="monotone" dataKey="submitted" stroke="#4f8ef7" fillOpacity={1} fill="url(#colorSub)" />
            <Area type="monotone" dataKey="resolved" stroke="#7c3aed" fillOpacity={0.2} fill="#7c3aed" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-row">
        <div className="chart-card card">
          <p className="section-title">Severity Distribution</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={adminAnalytics.severityDist} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {adminAnalytics.severityDist.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0b1120', border: '1px solid #273449' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card card">
          <p className="section-title">Hazard Type Breakdown</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={adminAnalytics.typeBreakdown} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="type" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0b1120', border: '1px solid #273449' }} />
              <Bar dataKey="count" fill="#4f8ef7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="screen-content">
      <div className="card admin-panel">
        <div className="section-header">
          <div>
            <p className="section-title">API Configuration</p>
            <h2>Integration settings</h2>
          </div>
        </div>
        <label className="input-group">
          <span className="input-label">Ngrok URL</span>
          <input className="input-field" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
        </label>
        <div className="admin-settings-row">
          <button type="button" className="btn-primary" onClick={handleSaveApi}>Save</button>
          <button type="button" className="btn-secondary">Test Connection</button>
        </div>
      </div>
      <div className="card admin-panel">
        <div className="section-header">
          <div>
            <p className="section-title">Admin Account</p>
            <h2>{localStorage.getItem('roadguard_admin_session') ? 'admin@roadguard.in' : 'admin@roadguard.in'}</h2>
          </div>
        </div>
        <p className="mini-text">Change password and account preferences.</p>
        <button type="button" className="btn-secondary">Change Password</button>
      </div>
      <div className="card admin-panel">
        <div className="section-header">
          <div>
            <p className="section-title">Data Management</p>
            <h2>Report storage</h2>
          </div>
        </div>
        <p className="mini-text">Total reports: {reports.length}</p>
        <button type="button" className="btn-secondary">Clear Ignored Reports</button>
      </div>
      <div className="card admin-panel">
        <div className="section-header">
          <div>
            <p className="section-title">About</p>
            <h2>System status</h2>
          </div>
        </div>
        <p className="mini-text">Version 1.0.0 • All systems nominal</p>
        <button type="button" className="btn-secondary" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#060D0D' }}>
      <div style={{ padding: 20, background: '#060D0D', borderBottom: '1px solid rgba(0,201,167,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Admin Dashboard</p>
          <h1 style={{ fontSize: 24, color: '#E8FFF8', margin: 0 }}>Control Center</h1>
        </div>
        <button type="button" style={{ padding: 8, background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer' }} onClick={handleLogout}>Logout</button>
      </div>
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'settings' && renderSettings()}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '72px', paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: 'rgba(6,13,13,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,201,167,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 1000 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%', gap: '3px', border: 'none', background: activeTab === tab.key ? 'rgba(0,201,167,0.1)' : 'none', cursor: 'pointer', padding: '8px 0', WebkitTapHighlightColor: 'transparent', transform: activeTab === tab.key ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s ease' }}
            onClick={() => setActiveTab(tab.key)}
          >
            <span style={{ fontSize: '26px', lineHeight: 1, filter: activeTab === tab.key ? 'drop-shadow(0 0 8px #00C9A7)' : 'none', transition: 'all 0.2s ease' }}>{tab.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: activeTab === tab.key ? '#00C9A7' : '#3D6B60', transition: 'color 0.2s ease' }}>{tab.label}</span>
          </button>
        ))}
      </nav>
      {toast && <div style={{ position: 'fixed', top: 20, left: 20, right: 20, zIndex: 2000, background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}><div style={{ display: 'flex', justifyContent: 'center' }}><span style={{ color: '#E8FFF8' }}>{toast}</span></div></div>}
      {showDetail && selectedReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDetail(false)}>
          <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, maxWidth: 400, width: '90%', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button type="button" style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#E8FFF8', fontSize: 24, cursor: 'pointer' }} onClick={() => setShowDetail(false)}>×</button>
            <img style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16 }} src={selectedReport.image} alt={selectedReport.type} />
            <div style={{ paddingTop: 16 }}>
              <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>{selectedReport.type}</p>
              <h2 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>{selectedReport.location.address}</h2>
              <p style={{ fontSize: 12, color: '#7EB8A8', margin: '4px 0' }}>Reported by {selectedReport.reporter} · {timeAgo(selectedReport.timestamp)}</p>
              <p style={{ color: '#7EB8A8', margin: '8px 0' }}>{selectedReport.description || 'No additional description provided.'}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" style={{ padding: 12, background: '#00C9A7', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={() => { handleAction(selectedReport.id, 'resolve'); setShowDetail(false); }}>✅ Resolve</button>
                <button type="button" style={{ padding: 12, background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={() => { handleAction(selectedReport.id, 'ignore'); setShowDetail(false); }}>❌ Ignore</button>
                <button type="button" style={{ padding: 12, background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>🚩 Escalate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
