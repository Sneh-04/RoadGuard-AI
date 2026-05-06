import { createContext, useContext, useEffect, useState } from 'react';
import { sampleHazards, sampleCongestion, sampleAlerts, sampleSensorReadings, sampleStats } from '../utils/mockData.js';
import { formatTime } from '../utils/helpers.js';

const AppContext = createContext(null);

const STORAGE_KEY = 'roadguard_v1';
const DEFAULT_API = 'http://localhost:8002';

const initialState = {
  user: null,
  onboardingComplete: false,
  apiBase: DEFAULT_API,
  reports: sampleHazards,
  congestion: sampleCongestion,
  alerts: sampleAlerts,
  sensorReadings: sampleSensorReadings,
  stats: sampleStats,
  settings: {
    darkMode: true,
    notifications: true,
  },
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(initialState.user);
  const [onboardingComplete, setOnboardingComplete] = useState(initialState.onboardingComplete);
  const [apiBase, setApiBase] = useState(initialState.apiBase);
  const [reports, setReports] = useState(initialState.reports);
  const [congestion, setCongestion] = useState(initialState.congestion);
  const [alerts, setAlerts] = useState(initialState.alerts);
  const [sensorReadings, setSensorReadings] = useState(initialState.sensorReadings);
  const [stats, setStats] = useState(initialState.stats);
  const [settings, setSettings] = useState(initialState.settings);
  const [showToast, setShowToast] = useState(null);

  useEffect(() => {
    try {
      const payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (payload) {
        setUser(payload.user || null);
        setOnboardingComplete(payload.onboardingComplete ?? false);
        setApiBase(payload.apiBase || DEFAULT_API);
        setReports(payload.reports || initialState.reports);
        setCongestion(payload.congestion || initialState.congestion);
        setAlerts(payload.alerts || initialState.alerts);
        setSensorReadings(payload.sensorReadings || initialState.sensorReadings);
        setStats(payload.stats || initialState.stats);
        setSettings(payload.settings || initialState.settings);
      }
    } catch (error) {
      console.warn('Unable to load RoadGuard storage', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user,
        onboardingComplete,
        apiBase,
        reports,
        congestion,
        alerts,
        sensorReadings,
        stats,
        settings,
      }),
    );
  }, [user, onboardingComplete, apiBase, reports, congestion, alerts, sensorReadings, stats, settings]);

  const signUp = (payload) => {
    const { fullName, email, phone, city, vehicle, password } = payload;
    if (!fullName || !email || !phone || !city || !vehicle || !password) {
      throw new Error('Please complete every field before creating your account.');
    }
    const userData = {
      fullName,
      email,
      phone,
      city,
      vehicle,
      avatar: payload.avatar || null,
      password,
      createdAt: new Date().toISOString(),
    };
    setUser(userData);
    setShowToast(`Welcome, ${fullName.split(' ')[0]}! 👋`);
    return userData;
  };

  const login = ({ email, password }) => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }
    const payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!payload || !payload.user || payload.user.email !== email || payload.user.password !== password) {
      throw new Error('Credentials do not match our records.');
    }
    setUser(payload.user);
    setShowToast(`Welcome back, ${payload.user.fullName.split(' ')[0]}! 👋`);
    return payload.user;
  };

  const logout = () => {
    setUser(null);
    setShowToast('Logged out successfully.');
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
  };

  const addReport = (report) => {
    const entry = {
      id: `rpt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...report,
    };
    setReports((current) => [entry, ...current]);
    setAlerts((current) => [
      {
        id: `alert_${Date.now()}`,
        title: `${entry.type} reported near ${entry.location.city}`,
        description: entry.description || 'Community report received for local road safety.',
        timestamp: new Date().toISOString(),
        votes: 1,
      },
      ...current,
    ]);
    setShowToast('Report submitted! ✅');
    return entry;
  };

  const updateApiBase = (value) => {
    setApiBase(value);
    setShowToast('API endpoint updated.');
  };

  const updateSettings = (next) => {
    setSettings((current) => ({ ...current, ...next }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        onboardingComplete,
        apiBase,
        reports,
        congestion,
        alerts,
        sensorReadings,
        stats,
        settings,
        showToast,
        setShowToast,
        signUp,
        login,
        logout,
        completeOnboarding,
        addReport,
        updateApiBase,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return context;
}
