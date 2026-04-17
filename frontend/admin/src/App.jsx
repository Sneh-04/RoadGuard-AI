import { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ActivityPage from './pages/ActivityPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import NavigatePage from './pages/NavigatePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import BottomNav from './components/BottomNav.jsx';

const routeMap = {
  '/': 'home',
  '/report': 'report',
  '/navigate': 'navigate',
  '/activity': 'activity',
  '/profile': 'profile',
};

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = routeMap[location.pathname] || 'home';

  const handleNavChange = (key) => {
    const path = Object.entries(routeMap).find(([, value]) => value === key)?.[0] || '/';
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#0f2f2f] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <main className="min-h-[calc(100vh-132px)] pb-36">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/navigate" element={<NavigatePage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <BottomNav active={activePage} onChange={handleNavChange} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
