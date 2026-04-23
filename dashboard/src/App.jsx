import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, normal: 0, speedbreaker: 0, pothole: 0 });
  const [apiConnected, setApiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Color mapping for hazard types
  const getColor = (label) => {
    switch (label) {
      case 0: return '#3B82F6'; // Blue - Normal
      case 1: return '#F59E0B'; // Amber - Speed Breaker
      case 2: return '#EF4444'; // Red - Pothole
      default: return '#6B7280'; // Gray
    }
  };

  const getLabelName = (label) => {
    switch (label) {
      case 0: return 'Normal';
      case 1: return 'Speed Breaker';
      case 2: return 'Pothole';
      default: return 'Unknown';
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/events', { timeout: 5000 });
      const eventData = response.data.events || [];
      setEvents(eventData);
      setApiConnected(true);
      setError(null);

      // Calculate stats
      const total = eventData.length;
      const normal = eventData.filter(e => e.label === 0).length;
      const speedbreaker = eventData.filter(e => e.label === 1).length;
      const pothole = eventData.filter(e => e.label === 2).length;

      setStats({ total, normal, speedbreaker, pothole });
    } catch (error) {
      console.error('Failed to fetch events:', error.message);
      setApiConnected(false);
      setError(error.message);
      // Set empty data but don't crash
      setEvents([]);
      setStats({ total: 0, normal: 0, speedbreaker: 0, pothole: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const recentEvents = events.slice(0, 10);

  // Fallback UI when API is not connected
  if (!apiConnected && loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">RoadGuard-AI Dashboard</h1>
          <p className="text-gray-600 mb-4">Connecting to backend...</p>
          <p className="text-sm text-gray-500">Attempting to connect to http://localhost:8000</p>
        </div>
      </div>
    );
  }

  if (!apiConnected && !loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-orange-100">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Connection Failed</h1>
          <p className="text-red-700 mb-4">
            Could not connect to backend API
          </p>
          <div className="bg-red-100 border border-red-400 rounded p-4 mb-4 text-left">
            <p className="text-sm font-mono text-red-800">
              <strong>Issue:</strong> {error || 'Unknown error'}<br/>
              <strong>Backend URL:</strong> http://localhost:8000<br/>
              <strong>Status:</strong> Ensure the backend is running with: <code>python start.py</code>
            </p>
          </div>
          <button 
            onClick={fetchEvents}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold">🛣️ RoadGuard-AI</h1>
            <p className="text-blue-100 text-sm">Live Hazard Detection System</p>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
            <div className={`w-3 h-3 rounded-full ${apiConnected ? 'bg-green-400' : 'bg-red-500'} animate-pulse`}></div>
            <span className="font-semibold">{apiConnected ? '✅ Connected' : '❌ Disconnected'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="text-4xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-600 text-sm mt-1">Total Events</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="text-4xl font-bold text-green-600">{stats.normal}</div>
              <div className="text-gray-600 text-sm mt-1">Normal Roads</div>
              <div className="text-green-500 text-xs mt-1">
                {stats.total > 0 ? ((stats.normal / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <div className="text-4xl font-bold text-amber-600">{stats.speedbreaker}</div>
              <div className="text-gray-600 text-sm mt-1">Speed Breakers</div>
              <div className="text-amber-500 text-xs mt-1">
                {stats.total > 0 ? ((stats.speedbreaker / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="text-4xl font-bold text-red-600">{stats.pothole}</div>
              <div className="text-gray-600 text-sm mt-1">Potholes</div>
              <div className="text-red-500 text-xs mt-1">
                {stats.total > 0 ? ((stats.pothole / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          {/* Recent Events List */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📍 Recent Hazards</h2>
            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-5xl mb-4">🌍</div>
                <p className="text-gray-600">No hazards detected yet</p>
                <p className="text-gray-400 text-sm mt-2">Events will appear here as they are detected</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition border-t-4"
                    style={{ borderTopColor: getColor(event.label) }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-lg text-gray-800">
                          {getLabelName(event.label)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getColor(event.label) }}
                      ></div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-semibold">{(event.confidence * 100).toFixed(1)}%</span>
                      </div>
                      {event.p_sensor !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sensor:</span>
                          <span className="font-semibold">{(event.p_sensor * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {event.p_vision !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vision:</span>
                          <span className="font-semibold">{(event.p_vision * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Lat: {event.latitude.toFixed(4)}</span>
                        <span>Lon: {event.longitude.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 text-center py-3 text-sm">
        Last updated: {new Date().toLocaleTimeString()} | Backend: {apiConnected ? '🟢 Online' : '🔴 Offline'}
      </footer>
    </div>
  );
}

export default App;