import * as Notifications from 'expo-notifications';
import { notificationService } from '../src/services/notificationService';

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  AndroidNotificationPriority: {
    HIGH: 'high',
    DEFAULT: 'default',
    LOW: 'low',
  },
  AndroidImportance: {
    MAX: 'max',
    HIGH: 'high',
    DEFAULT: 'default',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize successfully with granted permissions', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'test-token' });

    const success = await notificationService.initialize();

    expect(success).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(notificationService.getToken()).toBe('test-token');
  });

  test('should fail initialization when permissions denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const success = await notificationService.initialize();

    expect(success).toBe(false);
  });

  test('should send local notification', async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

    const notificationData = {
      title: 'Test Notification',
      body: 'This is a test',
      data: { type: 'test' },
      sound: true,
      priority: 'high' as const,
    };

    await notificationService.sendLocalNotification(notificationData);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Test Notification',
        body: 'This is a test',
        data: { type: 'test' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  });

  test('should send hazard alert notification', async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

    const hazardData = {
      hazardId: '123',
      hazardType: 1,
      latitude: 40.7128,
      longitude: -74.0060,
      confidence: 0.85,
      distance: 2.5,
    };

    await notificationService.sendHazardAlert(hazardData);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: '🚨 Speed Breaker Detected!',
        body: 'Hazard 2.5km away. Confidence: 85%',
        data: {
          type: 'hazard_alert',
          hazardId: '123',
          hazardType: 1,
          latitude: 40.7128,
          longitude: -74.0060,
          confidence: 0.85,
          distance: 2.5,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  });

  test('should send weather alert notification', async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

    await notificationService.sendWeatherAlert(
      'Heavy Rain Warning',
      'Expect wet roads and reduced visibility',
      { precipitation: 15, windSpeed: 25 }
    );

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: '🌤️ Heavy Rain Warning',
        body: 'Expect wet roads and reduced visibility',
        data: {
          type: 'weather_alert',
          precipitation: 15,
          windSpeed: 25,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: null,
    });
  });

  test('should schedule daily safety check', async () => {
    (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('scheduled-id');

    await notificationService.scheduleDailySafetyCheck();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: '🛡️ Daily Safety Check',
        body: 'Start your journey safely! Check RoadGuard-AI for hazards on your route.',
        data: { type: 'safety_reminder' },
        sound: false,
      },
      trigger: {
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
  });

  test('should handle notification responses', () => {
    const mockNotification = {
      request: {
        content: {
          data: { type: 'hazard_alert', hazardId: '123' }
        }
      }
    };

    // Mock console.log to avoid output in tests
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    notificationService['handleNotificationResponse'](mockNotification as any);

    expect(consoleSpy).toHaveBeenCalledWith('Navigate to hazard location:', { hazardId: '123' });

    consoleSpy.mockRestore();
  });
});