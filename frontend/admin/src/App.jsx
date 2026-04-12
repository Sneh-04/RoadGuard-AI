import { useMemo } from 'react';
import { AdminProvider, useAdminContext } from './context/AdminContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Overview from './pages/Overview.jsx';
import HazardMap from './pages/HazardMap.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopNav from './components/TopNav.jsx';
import Toast from './components/Toast.jsx';

function AdminShell() {
  const { admin, activePage, setActivePage, toast } = useAdminContext();

  const page = useMemo(() => {
    switch (activePage) {
      case 'overview':
        return <Overview />;
      case 'map':
        return <HazardMap />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <Users />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  }, [activePage]);

  if (!admin) return <LoginPage />;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 p-6 overflow-auto">
          {page}
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={toast.close} />}
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AdminShell />
    </AdminProvider>
  );
}
