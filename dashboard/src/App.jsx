import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, normal: 0, speedbreaker: 0, pothole: 0 });
  const [apiConnected, setApiConnected] = useState(false);

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
      const response = await axios.get('/api/events');
      const eventData = response.data.events;
      setEvents(eventData);
      setApiConnected(true);

      // Calculate stats
      const total = eventData.length;
      const normal = eventData.filter(e => e.label === 0).length;
      const speedbreaker = eventData.filter(e => e.label === 1).length;
      const pothole = eventData.filter(e => e.label === 2).length;

      setStats({ total, normal, speedbreaker, pothole });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setApiConnected(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const recentEvents = events.slice(0, 10);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">RoadGuard-AI — Live Hazard Map</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${apiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{apiConnected ? 'API Connected' : 'API Disconnected'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Map Panel */}
        <div className="w-3/5">
          <MapContainer
            center={[20.5, 78.9]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {events.map((event) => (
              <CircleMarker
                key={event.id}
                center={[event.latitude, event.longitude]}
                radius={8}
                fillColor={getColor(event.label)}
                color={getColor(event.label)}
                fillOpacity={0.8}
                stroke={false}
              >
                <Popup>
                  <div>
                    <strong>{getLabelName(event.label)}</strong><br/>
                    Time: {new Date(event.timestamp).toLocaleString()}<br/>
                    Confidence: {(event.confidence * 100).toFixed(1)}%<br/>
                    P_sensor: {event.p_sensor ? (event.p_sensor * 100).toFixed(1) + '%' : 'N/A'}<br/>
                    P_vision: {event.p_vision ? (event.p_vision * 100).toFixed(1) + '%' : 'N/A'}<br/>
                    Lat: {event.latitude.toFixed(6)}<br/>
                    Lon: {event.longitude.toFixed(6)}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Stats Panel */}
        <div className="w-2/5 bg-gray-100 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Statistics</h2>

          {/* Total Count */}
          <div className="mb-4">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-gray-600">Total Events</div>
          </div>

          {/* Per-class counts */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Normal</span>
              </div>
              <span className="font-semibold">{stats.normal} ({stats.total > 0 ? ((stats.normal / stats.total) * 100).toFixed(1) : 0}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span>Speed Breaker</span>
              </div>
              <span className="font-semibold">{stats.speedbreaker} ({stats.total > 0 ? ((stats.speedbreaker / stats.total) * 100).toFixed(1) : 0}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Pothole</span>
              </div>
              <span className="font-semibold">{stats.pothole} ({stats.total > 0 ? ((stats.pothole / stats.total) * 100).toFixed(1) : 0}%)</span>
            </div>
          </div>

          {/* Recent Events */}
          <h3 className="text-lg font-bold mb-2">Recent Events</h3>
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="bg-white p-3 rounded shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{getLabelName(event.label)}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm">
                      Conf: {(event.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getColor(event.label) }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;