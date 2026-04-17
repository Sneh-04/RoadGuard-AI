import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AdminContext = createContext(null);
const STORAGE_KEY = 'roadguard_admin_v1';

const initialState = {
  admin: null,
  activePage: 'overview',
  apiBase: 'http://localhost:8002/api/admin',
  reports: [],
  users: [],
  analytics: {},
  activityLog: [],
  toast: null,
  loading: false,
};

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(initialState.admin);
  const [activePage, setActivePage] = useState(initialState.activePage);
  const [apiBase, setApiBase] = useState(initialState.apiBase);
  const [reports, setReports] = useState(initialState.reports);
  const [users, setUsers] = useState(initialState.users);
  const [analytics, setAnalytics] = useState(initialState.analytics);
  const [activityLog, setActivityLog] = useState(initialState.activityLog);
  const [toast, setToast] = useState(initialState.toast);
  const [loading, setLoading] = useState(initialState.loading);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [liveHazards, setLiveHazards] = useState([]);
  const [liveStats, setLiveStats] = useState({ total: 0, normal: 0, speed_breaker: 0, pothole: 0 });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setAdmin({ email: decoded.sub, token });
        } else {
          localStorage.removeItem('admin_token');
        }
      } catch (e) {
        localStorage.removeItem('admin_token');
      }
    }
  }, []);

  useEffect(() => {
    if (admin) {
      fetchData();
    }
  }, [admin]);

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connectWebSocket = () => {
      setSocketStatus('connecting');
      socket = new WebSocket('ws://localhost:8002/ws/events');

      socket.onopen = () => {
        setSocketStatus('connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'snapshot') {
            setLiveStats(data.stats || { total: 0, normal: 0, speed_breaker: 0, pothole: 0 });
            setLiveHazards(
              (data.events || []).map((item, index) => ({
                id: item.id || `event_${index}`,
                type: item.label || item.type || 'Unknown',
                severity: item.severity || 'Medium',
                location: item.address || (item.lat && item.lng ? `${item.lat.toFixed(3)}, ${item.lng.toFixed(3)}` : 'Unknown'),
                reporter: item.reporter || 'Live feed',
                distance: item.distance || '—',
                lat: item.lat || 13.0827,
                lng: item.lng || 80.2707,
                timestamp: item.timestamp || new Date().toISOString(),
              }))
            );
          }

          if (data.type === 'event') {
            const liveEvent = {
              id: data.id || `event_${Date.now()}`,
              type: data.label || data.type || 'Live Report',
              severity: data.severity || 'Medium',
              location: data.address || (data.lat && data.lng ? `${data.lat.toFixed(3)}, ${data.lng.toFixed(3)}` : 'Unknown'),
              reporter: data.reporter || 'Live feed',
              distance: data.distance || '—',
              lat: data.lat || 13.0827,
              lng: data.lng || 80.2707,
              timestamp: data.timestamp || new Date().toISOString(),
            };

            setLiveHazards((current) => [liveEvent, ...current].slice(0, 50));
            setLiveStats((current) => ({
              ...current,
              total: (current.total || 0) + 1,
            }));
            setActivityLog((current) => [
              {
                id: `activity_${Date.now()}`,
                type: 'live_event',
                message: `${liveEvent.type} reported at ${liveEvent.location}`,
                timestamp: liveEvent.timestamp,
              },
              ...current,
            ].slice(0, 20));
          }
        } catch (err) {
          console.error('WebSocket parse error', err);
        }
      };

      socket.onclose = () => {
        setSocketStatus('reconnecting');
        reconnectTimer = window.setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = () => {
        setSocketStatus('error');
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, []);

  const api = axios.create({
    baseURL: apiBase,
  });

  api.interceptors.request.use((config) => {
    if (admin?.token) {
      config.headers.Authorization = `Bearer ${admin.token}`;
    }
    return config;
  });

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    const hide = () => setToast(null);
    setToast({ id, message, type, close: hide });
    setTimeout(hide, 5000);
  };

  const login = async ({ email, password }) => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiBase}/login`, { email, password });
      const { access_token } = response.data;
      localStorage.setItem('admin_token', access_token);
      const decoded = jwtDecode(access_token);
      setAdmin({ email: decoded.sub, token: access_token });
      showToast('Welcome to RoadGuard Admin Console.');
    } catch (error) {
      throw new Error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setActivePage('overview');
    localStorage.removeItem('admin_token');
    setReports([]);
    setAnalytics({});
    setActivityLog([]);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [complaintsRes, analyticsRes, activityRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/analytics'),
        api.get('/activity')
      ]);
      setReports(complaintsRes.data.complaints);
      setAnalytics(analyticsRes.data);
      setActivityLog(activityRes.data.logs);
    } catch (error) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      setReports(reports.map(r => r.id === id ? { ...r, status } : r));
      showToast(`Report status updated to ${status}`, 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const markResolved = (id) => updateReportStatus(id, 'solved');
  const markInProgress = (id) => updateReportStatus(id, 'in_progress');
  const rejectReport = (id) => updateReportStatus(id, 'ignored');

  const ignoreReport = (id, reason) => {
    updateReportStatus(id, 'Ignored');
    showToast(`Report ${id} ignored.`, 'warning');
  };

  const escalateReport = (id) => {
    updateReportStatus(id, 'Escalated');
    showToast(`Report ${id} escalated for higher review.`, 'info');
  };

  const addAdminNote = (reportId, note) => {
    setReports((current) => current.map((report) => {
      if (report.id !== reportId) return report;
      const notes = [...(report.notes || []), { id: `note_${Date.now()}`, text: note, createdAt: new Date().toISOString() }];
      return { ...report, notes };
    }));
    showToast('Admin note saved.', 'success');
  };

  const suspendUser = (userId, reason) => {
    setUsers((current) => current.map((user) => ({
      ...user,
      status: user.id === userId ? 'Suspended' : user.status,
    })));
    showToast('User suspended.', 'warning');
  };

  const contextValue = useMemo(() => ({
    admin,
    activePage,
    apiBase,
    reports,
    users,
    analytics,
    activityLog,
    toast,
    loading,
    socketStatus,
    liveHazards,
    liveStats,
    login,
    logout,
    setAdmin,
    setActivePage,

    markResolved,
    markInProgress,
    rejectReport,
    showToast,
  }), [admin, activePage, apiBase, reports, users, analytics, activityLog, toast, loading, socketStatus, liveHazards, liveStats]);

  return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
}
