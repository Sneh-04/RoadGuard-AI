import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAdminContext } from '../context/AdminContext.jsx';
import { AlertTriangle, MapPin, Calendar } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getStatusColor = (status) => {
  switch (status) {
    case 'Resolved': return 'green';
    case 'Pending': return 'orange';
    case 'In Progress': return 'blue';
    case 'Rejected': return 'red';
    default: return 'gray';
  }
};

const createCustomIcon = (status) => {
  const color = getStatusColor(status);
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export default function HazardMap() {
  const { reports, loading } = useAdminContext();
  const [selectedReport, setSelectedReport] = useState(null);

  const center = useMemo(() => {
    if (!reports.length) return [13.0827, 80.2707]; // Default to Chennai
    const avgLat = reports.reduce((sum, r) => sum + r.latitude, 0) / reports.length;
    const avgLng = reports.reduce((sum, r) => sum + r.longitude, 0) / reports.length;
    return [avgLat, avgLng];
  }, [reports]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
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
                icon={createCustomIcon(report.status)}
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
                            report.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            report.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {report.status}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                            report.priority === 'High' ? 'bg-red-100 text-red-800' :
                            report.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {report.priority} Priority
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
