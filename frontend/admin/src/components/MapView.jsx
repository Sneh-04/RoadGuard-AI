import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const hazardIcon = new L.DivIcon({
  className: 'custom-hazard-marker',
  html: `<div class="h-10 w-10 rounded-full border border-white/20 bg-red-500/95 shadow-[0_0_15px_rgba(239,68,68,0.35)] flex items-center justify-center"><div class="h-4 w-4 rounded-full bg-white"></div></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const initialMarkers = [
  { position: [13.084, 80.270], type: 'Pothole', severity: 'High' },
  { position: [13.089, 80.276], type: 'Flooding', severity: 'High' },
  { position: [13.076, 80.264], type: 'Speedbump', severity: 'Medium' },
];

const route = [
  [13.0827, 80.2707],
  [13.0855, 80.2752],
  [13.0897, 80.2798],
];

export default function MapView() {
  const [hazardMarkers, setHazardMarkers] = useState(initialMarkers);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [hazardStats, setHazardStats] = useState({ total: 0, normal: 0, speed_breaker: 0, pothole: 0 });

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connectWebSocket = () => {
      socket = new WebSocket('ws://localhost:8002/ws/events');

      socket.addEventListener('open', () => {
        setConnectionStatus('connected');
      });

      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'snapshot') {
            setHazardStats(data.stats || {});
            setHazardMarkers(
              (data.events || []).map((item, index) => ({
                position: [item.lat || 13.0827, item.lng || 80.2707],
                type: item.label || item.type || 'Unknown',
                severity: item.severity || item.label || 'Medium',
                id: item.id || index,
              }))
            );
          }

          if (data.type === 'event') {
            setHazardStats((current) => ({
              ...current,
              total: (current.total || 0) + 1,
            }));
            setHazardMarkers((current) => [
              { position: [data.lat || 13.0827, data.lng || 80.2707], type: data.label || data.type || 'New hazard', severity: data.severity || 'Medium', id: data.id || Date.now() },
              ...current,
            ].slice(0, 50));
          }
        } catch (error) {
          console.error('Failed to parse websocket message', error);
        }
      });

      socket.addEventListener('close', () => {
        setConnectionStatus('reconnecting');
        reconnectTimer = window.setTimeout(connectWebSocket, 3000);
      });

      socket.addEventListener('error', () => {
        setConnectionStatus('error');
        socket.close();
      });
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

  const polyline = useMemo(() => route, []);

  return (
    <div className="relative h-[560px] rounded-[2rem] border border-white/10 bg-[#0f2f2f]/70 shadow-[0_35px_80px_rgba(20,184,166,0.18)] backdrop-blur-xl">
      <div className="absolute left-4 top-4 z-10 grid w-fit grid-cols-2 gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/85 p-4 text-sm text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase text-slate-400">Live status</p>
          <p className={`font-semibold ${connectionStatus === 'connected' ? 'text-emerald-300' : 'text-amber-300'}`}>
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting…' : connectionStatus === 'reconnecting' ? 'Reconnecting…' : 'Offline'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Live hazards</p>
          <p className="font-semibold text-slate-100">{hazardStats.total || hazardMarkers.length}</p>
        </div>
      </div>

      <MapContainer center={[13.0827, 80.2707]} zoom={13} scrollWheelZoom={false} className="h-full w-full rounded-[2rem]">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        <Polyline pathOptions={{ color: '#14b8a6', weight: 5, opacity: 0.85 }} positions={polyline} />
        {hazardMarkers.map((marker) => (
          <Marker key={`${marker.id}-${marker.position.join('-')}`} icon={hazardIcon} position={marker.position}>
            <Popup>
              <div className="space-y-1 text-sm text-slate-900">
                <p className="font-semibold">{marker.type}</p>
                <p>Severity: {marker.severity}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
