import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapView = ({ events = [] }) => {
  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {events.map((e) => (
          <Marker key={e.id} position={[e.latitude, e.longitude]}>
            <Popup>
              <b>{e.label}</b> <br />
              Status: {e.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
