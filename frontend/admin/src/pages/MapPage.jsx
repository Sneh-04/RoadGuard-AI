import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealTime } from '../context/RealTimeContext.jsx';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getHazardColor = (label) => {
  if (label === 0 || label === 'Normal') return '#3B82F6';
  if (label === 1 || label === 'speedbreaker' || label === 'Speed Breaker') return '#F59E0B';
  if (label === 2 || label === 'pothole' || label === 'Pothole') return '#EF4444';
  return '#6B7280';
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

export default function MapPage() {
  const { hazards, connectionStatus } = useRealTime();

  const center = useMemo(() => {
    if (hazards.length === 0) return [13.0827, 80.2707];
    const avgLat = hazards.reduce((sum, h) => sum + (h.latitude || 13.0827), 0) / hazards.length;
    const avgLng = hazards.reduce((sum, h) => sum + (h.longitude || 80.2707), 0) / hazards.length;
    return [avgLat, avgLng];
  }, [hazards]);

  const stats = useMemo(() => {
    return {
      total: hazards.length,
      normal: hazards.filter((h) => h.label === 0).length,
      speedbreaker: hazards.filter((h) => h.label === 1).length,
      pothole: hazards.filter((h) => h.label === 2).length,
    };
  }, [hazards]);

  return (
    <div className="h-full flex flex-col">
      {/* Stats Bar */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Total</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{stats.total}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Normal</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.normal}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Speed Breaker</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{stats.speedbreaker}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Pothole</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.pothole}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Status</p>
            <p
              className={`text-sm font-bold mt-1 ${
                connectionStatus === 'connected'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {connectionStatus === 'connected' ? '🟢 Live' : '🟡 Connecting'}
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {hazards.map((hazard) => (
            <Marker
              key={hazard.id}
              position={[hazard.latitude || 13.0827, hazard.longitude || 80.2707]}
              icon={createHazardIcon(hazard.label)}
            >
              <Popup>
                <div className="text-sm space-y-1 text-slate-900">
                  <p className="font-bold">{hazard.label_name || 'Hazard'}</p>
                  <p>Confidence: {(hazard.confidence * 100).toFixed(1)}%</p>
                  <p className="text-xs text-slate-600">
                    {new Date(hazard.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">
                    Status: {hazard.status || 'active'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
