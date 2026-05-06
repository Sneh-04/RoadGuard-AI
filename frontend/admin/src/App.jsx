import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopNav from './components/TopNav.jsx';
import Sidebar from './components/Sidebar.jsx';
import { RealTimeProvider } from './context/RealTimeContext.jsx';

// User Pages
import HomePage from './pages/HomePage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import MapPage from './pages/MapPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminHazards from './pages/AdminHazards.jsx';

function AppLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar isAdmin={isAdmin} onAdminToggle={setIsAdmin} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <TopNav isAdmin={isAdmin} onAdminToggle={setIsAdmin} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="min-h-full">
            <Routes>
              {/* User Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/hazards" element={<AdminHazards />} />

              {/* Catch All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RealTimeProvider>
        <AppLayout />
      </RealTimeProvider>
    </BrowserRouter>
  );
}
