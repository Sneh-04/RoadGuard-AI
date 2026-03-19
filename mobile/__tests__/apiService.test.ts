import { apiService } from '../src/services/apiService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should make successful GET request', async () => {
    const mockResponse = { data: { id: 1, name: 'Test' } };
    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
      },
      get: jest.fn().mockResolvedValue({ data: mockResponse }),
    } as any);

    const result = await apiService.getHazards();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResponse);
  });

  test('should handle network errors with retry', async () => {
    const networkError = new Error('Network Error');
    (networkError as any).code = 'NETWORK_ERROR';

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
      },
      get: jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: { hazards: [] } }),
    } as any);

    const result = await apiService.getHazards();

    expect(result.success).toBe(true);
    expect(mockedAxios.create().get).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  test('should handle server errors appropriately', async () => {
    const serverError = {
      response: {
        status: 500,
        data: { detail: 'Internal Server Error' }
      }
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
      },
      get: jest.fn().mockRejectedValue(serverError),
    } as any);

    const result = await apiService.getHazards();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Internal Server Error');
  });

  test('should handle 4xx client errors without retry', async () => {
    const clientError = {
      response: {
        status: 404,
        data: { detail: 'Not Found' }
      }
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
      },
      get: jest.fn().mockRejectedValue(clientError),
    } as any);

    const result = await apiService.getHazards();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not Found');
    expect(mockedAxios.create().get).toHaveBeenCalledTimes(1); // No retries for 4xx
  });

  test('should report hazard successfully', async () => {
    const hazardData = {
      hazard_type: 1,
      latitude: 40.7128,
      longitude: -74.0060,
      confidence: 0.9
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
      },
      post: jest.fn().mockResolvedValue({ data: { id: '123', ...hazardData } }),
    } as any);

    const result = await apiService.reportHazard(hazardData);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('123');
  });

  test('should get weather data', async () => {
    const weatherData = {
      temperature: 22,
      condition: 'Clear',
      precipitation: 0
    };

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
      },
      get: jest.fn().mockResolvedValue({ data: weatherData }),
    } as any);

    const result = await apiService.getWeather(40.7128, -74.0060);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(weatherData);
  });
});