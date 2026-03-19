// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/signup',
    PROFILE: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  HAZARDS: {
    LIST: '/events',
    REPORT: '/hazards/report',
    HISTORY: '/events',
  },
  PREDICT: '/predict',
  WEATHER: '/weather',
  CHAT: '/chat',
  ADMIN: {
    USERS: '/admin/users',
    STATS: '/admin/stats',
    REPORTS: '/admin/reports',
  },
};

export const API_TIMEOUT = 10000;

export const API_RETRY = {
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
};
