import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { ArrowRight, RotateCcw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Navigate = () => {
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState(null);

  const chennaiCenter = [13.0827, 80.2707];

  const hazards = [
    { position: [13.0827, 80.2707], type: 'Pothole', severity: 'High' },
    { position: [13.0927, 80.2807], type: 'Flooding', severity: 'Medium' },
    { position: [13.0727, 80.2607], type: 'Speedbump', severity: 'Low' },
  ];

  const handlePlanRoute = () => {
    // Simulate route planning
    const simulatedRoute = [
      [13.0827, 80.2707],
      [13.085, 80.275],
      [13.09, 80.28],
      [13.0927, 80.2807],
    ];
    setRoute(simulatedRoute);
  };

  const handleSwap = () => {
    // Swap logic if needed
  };

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 left-4 right-4 z-10 bg-background/80 backdrop-blur-md rounded-2xl p-4 border border-white/20">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="flex-1 p-2 bg-white/10 rounded-lg text-white placeholder-white/50"
          />
          <button onClick={handleSwap} className="p-2 bg-primary rounded-lg">
            <RotateCcw size={20} className="text-white" />
          </button>
          <button
            onClick={handlePlanRoute}
            className="px-4 py-2 bg-primary rounded-lg text-white font-semibold hover:bg-primary/80 transition-colors"
          >
            Plan Safe Route
          </button>
        </div>
      </div>

      <MapContainer center={chennaiCenter} zoom={13} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {hazards.map((hazard, index) => (
          <Marker key={index} position={hazard.position}>
            <Popup>
              <div className="text-black">
                <strong>{hazard.type}</strong><br />
                Severity: {hazard.severity}
              </div>
            </Popup>
          </Marker>
        ))}
        {route && (
          <Polyline positions={route} color="teal" weight={5} />
        )}
      </MapContainer>
    </div>
  );
};

export default Navigate;