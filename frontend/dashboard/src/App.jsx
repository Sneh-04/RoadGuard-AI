import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext.jsx';
import SplashScreen from './screens/onboarding/SplashScreen.jsx';
import OnboardingSlides from './screens/onboarding/OnboardingSlides.jsx';
import AuthScreen from './screens/onboarding/AuthScreen.jsx';
import RoleSelect from './screens/onboarding/RoleSelect.jsx';
import AdminLogin from './screens/admin/AdminLogin.jsx';
import AdminDashboard from './screens/admin/AdminDashboard.jsx';
import BottomNav from './components/BottomNav.jsx';
import Toast from './components/Toast.jsx';
// lazy load main screens
const Home = lazy(() => import('./screens/Home.jsx'));
const Report = lazy(() => import('./screens/Report.jsx'));
const Navigate = lazy(() => import('./screens/Navigate.jsx'));
const SensorData = lazy(() => import('./screens/SensorData.jsx'));
const Profile = lazy(() => import('./screens/Profile.jsx'));// ErrorBoundary class here
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          color: 'white',
          padding: 40,
          textAlign: 'center',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080c14'
        }}>
        Something went wrong. Please restart the app.
        </div>
      );
    }

    return this.props.children;
  }
}
function AppContent() {
  const { user, onboardingComplete, completeOnboarding, showToast, setShowToast } = useAppContext();
  const [role, setRole] = useState(() => {
    const stored = localStorage.getItem('roadguard_role');
    return stored === 'admin' || stored === 'user' ? stored : null;
  });
  const [adminSession, setAdminSession] = useState(() =>
    localStorage.getItem('roadguard_admin_session') || null,
  );
  const [phase, setPhase] = useState('init');
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (!role) {
      setPhase('roleSelect');
      return;
    }

    if (role === 'admin') {
      setPhase(adminSession ? 'adminDashboard' : 'adminLogin');
      return;
    }

    if (role === 'user') {
      if (user) {
        setPhase('main');
        return;
      }
      setPhase('splash');
    }
  }, [role, adminSession, user]);

  const handleRoleSelect = (selectedRole) => {
    localStorage.setItem('roadguard_role', selectedRole);
    setRole(selectedRole);
    if (selectedRole === 'admin') setPhase('adminLogin');
    else setPhase('splash');
  };

  const handleAdminLogin = (session) => {
    setAdminSession(session);
    setPhase('adminDashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('roadguard_admin_session');
    localStorage.removeItem('roadguard_role');
    setAdminSession(null);
    setRole(null);
    setPhase('roleSelect');
  };

  const resetRole = () => {
    localStorage.removeItem('roadguard_role');
    localStorage.removeItem('roadguard_admin_session');
    setRole(null);
    setAdminSession(null);
    setPhase('roleSelect');
  };// Render logic
if (phase === 'roleSelect') return <RoleSelect onSelect={handleRoleSelect} />;
if (phase === 'splash') return <SplashScreen onComplete={() => setPhase('onboarding')} />;
if (phase === 'onboarding') return <OnboardingSlides onComplete={() => { completeOnboarding(); setPhase('auth'); }} />;
if (phase === 'auth') return <AuthScreen onSuccess={() => setPhase('main')} />;
if (phase === 'adminLogin') return <AdminLogin onSuccess={handleAdminLogin} onBack={resetRole} />;
if (phase === 'adminDashboard') return <AdminDashboard onLogout={handleAdminLogout} />;// Main user app
const renderScreen = () => {
switch (activeTab) {
case 'home': return <Suspense fallback={<div/>}><Home /></Suspense>;
case 'report': return <Suspense fallback={<div/>}><Report /></Suspense>;
case 'navigate': return <Suspense fallback={<div/>}><Navigate /></Suspense>;
case 'sensor': return <Suspense fallback={<div/>}><SensorData /></Suspense>;
case 'profile': return <Suspense fallback={<div/>}><Profile /></Suspense>;
default: return <Suspense fallback={<div/>}><Home /></Suspense>;
}
};return (
<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#060D0D' }}>
<div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: 80 }}>{renderScreen()}</div>
<BottomNav active={activeTab} onChange={setActiveTab} />
{showToast && <Toast message={showToast} onClose={() => setShowToast(null)} />}
</div>
);
}
export default function App() {
return (
<AppProvider>
<ErrorBoundary>
<AppContent />
</ErrorBoundary>
</AppProvider>
);
}
