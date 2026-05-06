import { BrowserRouter as Router, Routes, Route, useLocation, Navigate as RouterNavigate } from 'react-router-dom';
import { useState } from 'react';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Report from './pages/Report';
import NavigatePage from './pages/Navigate';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import SensorTest from './pages/SensorTest';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';

function AppRoutes({ role, setRole }) {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-white/10 p-2 px-3 text-sm text-white shadow-lg shadow-black/20">
        <span>Role: {role}</span>
        {role === 'user' ? (
          <button
            onClick={() => setRole('admin')}
            className="rounded-full bg-primary px-3 py-1 text-black font-semibold hover:bg-primary/90 transition"
          >
            Admin
          </button>
        ) : (
          <span className="rounded-full bg-white/10 px-3 py-1">Admin</span>
        )}
      </div>
      <Routes>
        <Route path="/" element={role === 'admin' ? <RouterNavigate to="/admin" replace /> : <Home />} />
        <Route path="/report" element={role === 'admin' ? <RouterNavigate to="/admin" replace /> : <Report />} />
        <Route path="/navigate" element={role === 'admin' ? <RouterNavigate to="/admin" replace /> : <NavigatePage />} />
        <Route path="/activity" element={role === 'admin' ? <RouterNavigate to="/admin" replace /> : <Activity />} />
        <Route path="/profile" element={role === 'admin' ? <RouterNavigate to="/admin" replace /> : <Profile />} />
        <Route path="/sensor-test" element={<SensorTest />} />

        <Route path="/admin" element={
          role === 'admin' ? <AdminLayout role={role} setRole={setRole} /> : <RouterNavigate to="/" replace />
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        <Route path="*" element={<RouterNavigate to={role === 'admin' ? '/admin' : '/'} replace />} />
      </Routes>
      {!isAdminPath && <BottomNav />}
    </div>
  );
}

function App() {
  const [role, setRole] = useState('user');

  return (
    <Router>
      <AppRoutes role={role} setRole={setRole} />
    </Router>
  );
}

export default App;
