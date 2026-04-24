import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, MapPin, Calendar } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getHazardColor = (label) => {
  if (label === 0 || label === 'Normal') return 'blue';
  if (label === 1 || label === 'speedbreaker' || label === 'Speed Breaker') return 'orange';
  if (label === 2 || label === 'pothole' || label === 'Pothole') return 'red';
  return 'gray';
};

const getStatusColor = (label) => {
  const color = getHazardColor(label);
  const colorMap = {
    'blue': '#3B82F6',
    'orange': '#F59E0B',
    'red': '#EF4444',
    'gray': '#6B7280'
  };
  return colorMap[color] || '#6B7280';
};

const createCustomIcon = (label) => {
  const color = getStatusColor(label);
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export default function HazardMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/events');
        const data = await response.json();
        
        if (data.events && Array.isArray(data.events)) {
          setReports(data.events);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const center = useMemo(() => {
    if (!reports.length) return [13.0827, 80.2707];
    const avgLat = reports.reduce((sum, r) => sum + r.latitude, 0) / reports.length;
    const avgLng = reports.reduce((sum, r) => sum + r.longitude, 0) / reports.length;
    return [avgLat, avgLng];
  }, [reports]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 rounded-[2rem] border border-white/10 bg-[#0f2f2f]/70">
        <div className="text-slate-100">Loading map data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-[560px] rounded-[2rem] border border-white/10 bg-[#0f2f2f]/70 shadow-[0_35px_80px_rgba(20,184,166,0.18)] backdrop-blur-xl overflow-hidden">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          {reports.map((report, idx) => (
            <Marker
              key={report.id || idx}
              position={[report.latitude || 13.0827, report.longitude || 80.2707]}
              icon={createCustomIcon(report.label)}
              onClick={() => setSelectedReport(report)}
            >
              <Popup>
                <div className="text-sm min-w-[220px]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} />
                    <span className="font-bold">{report.label_name || 'Hazard'}</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Confidence: {(report.confidence * 100).toFixed(1)}%</p>
                    <p className="flex items-center gap-1">
                      <MapPin size={12} /> Lat: {report.latitude.toFixed(4)}, Lon: {report.longitude.toFixed(4)}
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(report.timestamp).toLocaleString()}
                    </p>
                    {report.p_sensor !== null && <p>Sensor: {(report.p_sensor * 100).toFixed(1)}%</p>}
                    {report.p_vision !== null && <p>Vision: {(report.p_vision * 100).toFixed(1)}%</p>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid gap-6">
        <div className="rounded-[2rem] border border-white/10 bg-[#0f2f2f]/70 p-6 shadow-[0_35px_80px_rgba(20,184,166,0.18)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Recent Hazard Reports ({reports.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reports.slice(0, 10).map((report, idx) => (
              <div
                key={report.id || idx}
                className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-100">{report.label_name || 'Hazard'}</p>
                  <p className="text-xs text-slate-400">
                    {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)} • {new Date(report.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Confidence: {(report.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(report.label) }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
        <h2 className="text-3xl font-bold text-gray-900">Hazard Map</h2>
        <p className="text-gray-600">Interactive map showing all reported hazards</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {reports.map((report) => (
              <Marker
                key={report._id}
                position={[report.latitude, report.longitude]}
                icon={createCustomIcon(report.severity)}
                eventHandlers={{
                  click: () => setSelectedReport(report),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-64">
                    <div className="flex items-start space-x-3">
                      {report.image && (
                        <img
                          src={`data:image/jpeg;base64,${report.image}`}
                          alt="Hazard"
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{report.description}</h3>
                        <div className="flex items-center text-xs text-gray-600 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                        </div>
                        <div className="flex items-center text-xs text-gray-600 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(report.timestamp).toLocaleDateString()}
                        </div>
                        <div className="mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            report.status === 'solved' ? 'bg-green-100 text-green-800' :
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            report.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {report.status}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                            report.severity === 'High' ? 'bg-red-100 text-red-800' :
                            report.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {report.severity} Severity
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {selectedReport && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Selected Report Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium">{selectedReport.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{selectedReport.latitude?.toFixed(4)}, {selectedReport.longitude?.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                selectedReport.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                selectedReport.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                selectedReport.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedReport.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Priority</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                selectedReport.priority === 'High' ? 'bg-red-100 text-red-800' :
                selectedReport.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selectedReport.priority}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reported At</p>
              <p className="font-medium">{new Date(selectedReport.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="font-medium">{selectedReport.user_id}</p>
            </div>
          </div>
          {selectedReport.image && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Image</p>
              <img
                src={`data:image/jpeg;base64,${selectedReport.image}`}
                alt="Hazard"
                className="max-w-md rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
