import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getHazardColor = (label) => {
  if (label === 0 || label === 'Normal') return '#3B82F6'; // Blue
  if (label === 1 || label === 'speedbreaker' || label === 'Speed Breaker') return '#F59E0B'; // Amber
  if (label === 2 || label === 'pothole' || label === 'Pothole') return '#EF4444'; // Red
  return '#6B7280'; // Gray
};

const createHazardIcon = (label) => {
  const color = getHazardColor(label);
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
    className: 'hazard-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function MapView() {
  const [hazardMarkers, setHazardMarkers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [hazardStats, setHazardStats] = useState({ total: 0, normal: 0, speedbreaker: 0, pothole: 0 });

  // Fetch initial events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/events');
        const data = await response.json();
        
        if (data.events && Array.isArray(data.events)) {
          setHazardMarkers(data.events.map((event) => ({
            id: event.id,
            position: [event.latitude || 13.0827, event.longitude || 80.2707],
            label: event.label_name || event.label || 'Unknown',
            confidence: event.confidence,
            timestamp: event.timestamp,
          })));
          
          // Calculate stats
          const total = data.events.length;
          const normal = data.events.filter(e => e.label === 0).length;
          const speedbreaker = data.events.filter(e => e.label === 1).length;
          const pothole = data.events.filter(e => e.label === 2).length;
          
          setHazardStats({ total, normal, speedbreaker, pothole });
          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setConnectionStatus('error');
      }
    };

    fetchEvents();
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket('ws://localhost:8000/ws/events');

        socket.addEventListener('open', () => {
          setConnectionStatus('connected');
        });

        socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'new_event' && data.event) {
              const event = data.event;
              setHazardMarkers((current) => [
                {
                  id: event.id,
                  position: [event.latitude || 13.0827, event.longitude || 80.2707],
                  label: event.label_name || event.label || 'Unknown',
                  confidence: event.confidence,
                  timestamp: event.timestamp,
                },
                ...current,
              ].slice(0, 100));

              setHazardStats((current) => ({
                ...current,
                total: (current.total || 0) + 1,
              }));
            }
          } catch (error) {
            console.error('Failed to parse websocket message', error);
          }
        });

        socket.addEventListener('close', () => {
          setConnectionStatus('reconnecting');
          reconnectTimer = window.setTimeout(connectWebSocket, 3000);
        });

        socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('error');
        });
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const center = useMemo(() => {
    if (!hazardMarkers.length) return [13.0827, 80.2707];
    const avgLat = hazardMarkers.reduce((sum, m) => sum + m.position[0], 0) / hazardMarkers.length;
    const avgLng = hazardMarkers.reduce((sum, m) => sum + m.position[1], 0) / hazardMarkers.length;
    return [avgLat, avgLng];
  }, [hazardMarkers]);

  const statusColor = connectionStatus === 'connected' ? 'emerald' : connectionStatus === 'connecting' ? 'amber' : 'red';
  const statusText = connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting…' : 'Offline';

  return (
    <div className="relative h-[560px] rounded-[2rem] border border-white/10 bg-[#0f2f2f]/70 shadow-[0_35px_80px_rgba(20,184,166,0.18)] backdrop-blur-xl overflow-hidden">
      <div className="absolute left-4 top-4 z-10 grid w-fit grid-cols-2 gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/85 p-4 text-sm text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div>
          <p className="text-xs text-slate-400">Total Hazards</p>
          <p className="text-2xl font-semibold">{hazardStats.total}</p>
        </div>
        <div>
          <p className={`text-xs text-${statusColor}-300`}>Status</p>
          <p className={`text-lg font-semibold text-${statusColor}-300`}>{statusText}</p>
        </div>
      </div>

      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        {hazardMarkers.map((marker) => (
          <Marker key={marker.id} position={marker.position} icon={createHazardIcon(marker.label)}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{marker.label}</p>
                <p className="text-xs text-gray-600">Confidence: {(marker.confidence * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-600">
                  {marker.timestamp ? new Date(marker.timestamp).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Lat: {marker.position[0].toFixed(4)} | Lon: {marker.position[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
