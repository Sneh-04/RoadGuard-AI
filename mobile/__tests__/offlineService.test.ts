import { offlineService } from '../src/services/offlineService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

describe('OfflineService', () => {
  beforeEach(() => {
    // Reset service state
    offlineService.clearCache();
    offlineService.clearQueue();
  });

  test('should initialize with default values', () => {
    expect(offlineService.isConnected()).toBe(true);
    expect(offlineService.getQueueLength()).toBe(0);
  });

  test('should cache hazard data', async () => {
    const testHazards = [
      { id: '1', hazard_type: 1, latitude: 40.7128, longitude: -74.0060, confidence: 0.9 }
    ];

    await offlineService.cacheHazardData(testHazards);
    const cached = await offlineService.getCachedHazards();

    expect(cached).toEqual(testHazards);
  });

  test('should queue hazard reports when offline', async () => {
    // Mock offline state
    Object.defineProperty(offlineService, 'isOnline', { value: false });

    const hazardData = {
      hazard_type: 1,
      latitude: 40.7128,
      longitude: -74.0060,
      confidence: 0.9
    };

    const queued = await offlineService.queueHazardReport(hazardData);
    expect(queued).toBe(false); // Should be queued, not processed
    expect(offlineService.getQueueLength()).toBe(1);
  });

  test('should validate hazard data', () => {
    const validHazard = {
      id: 'test',
      latitude: 40.7128,
      longitude: -74.0060,
      hazard_type: 1,
      confidence: 0.8
    };

    const invalidHazard = {
      latitude: 'invalid',
      hazard_type: 3, // Invalid type
    };

    expect(offlineService.validateHazardData(validHazard)).toBe(true);
    expect(offlineService.validateHazardData(invalidHazard)).toBe(false);
  });

  test('should deduplicate hazards', () => {
    const hazards = [
      { latitude: 40.7128, longitude: -74.0060, hazard_type: 1 },
      { latitude: 40.7128, longitude: -74.0060, hazard_type: 1 }, // Duplicate
      { latitude: 40.7129, longitude: -74.0061, hazard_type: 2 }, // Different
    ];

    const deduplicated = offlineService.deduplicateHazards(hazards);
    expect(deduplicated).toHaveLength(2);
  });

  test('should resolve hazard conflicts with higher confidence', async () => {
    const localHazard = {
      id: '1',
      confidence: 0.9,
      timestamp: '2024-01-01T10:00:00Z'
    };

    const serverHazard = {
      id: '1',
      confidence: 0.7,
      timestamp: '2024-01-01T09:00:00Z'
    };

    const resolved = await offlineService.resolveHazardConflict(localHazard, serverHazard);

    expect(resolved.confidence).toBe(0.9); // Should keep higher confidence
    expect(resolved.timestamp).toBe('2024-01-01T10:00:00Z'); // Should keep newer timestamp
  });
});