import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roadguard.app',
  appName: 'RoadGuard',
  webDir: 'dist',
  server: {
    cleartext: true,
  },
};

export default config;
