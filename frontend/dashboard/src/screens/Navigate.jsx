import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { classNames } from '../utils/helpers.js';

const defaultRoute = {
  origin: 'Current Location',
  destination: 'City Center',
  distance: 8.4,
  duration: 18,
  hazards: 4,
  safetyScore: 81,
};

export default function Navigate() {
  const { congestion, reports } = useAppContext();
  const [origin, setOrigin] = useState(defaultRoute.origin);
  const [destination, setDestination] = useState(defaultRoute.destination);
  const [routeInfo, setRouteInfo] = useState(defaultRoute);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);

  useEffect(() => {
    try {
      if (window.L) {
        leafletRef.current = window.L;
        initializeMap();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        try {
          leafletRef.current = window.L;
          initializeMap();
        } catch (e) {
          console.warn('Failed to initialize map after script load', e);
        }
      };
      script.onerror = () => {
        console.warn('Failed to load Leaflet script');
      };
      document.body.appendChild(script);
    } catch (e) {
      console.warn('Map initialization failed', e);
    }
  }, []);

  const initializeMap = () => {
    try {
      const L = leafletRef.current;
      if (!L || mapRef.current?.dataset.ready) return;
      const map = L.map(mapRef.current, {
        center: [13.0827, 80.2707],
        zoom: 13,
        zoomControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      reports.slice(0, 5).forEach((report, index) => {
        try {
          const color = report.severity === 'High' ? '#ef4444' : report.severity === 'Medium' ? '#f59e0b' : '#22c55e';
          const marker = L.circleMarker([report.latitude, report.longitude], {
            radius: 7,
            fillColor: color,
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9,
          });
          marker.addTo(map).bindPopup(`${report.type} • ${report.severity}`);
        } catch (e) {
          console.warn('Failed to add marker', e);
        }
      });
      mapRef.current.dataset.ready = 'true';
      setMapReady(true);
    } catch (e) {
      console.warn('Map initialization failed', e);
    }
  };

  const handleRoute = () => {
    setRouteInfo((current) => ({
      ...current,
      origin,
      destination,
      distance: Math.max(4.2, Math.round((Math.random() * 12 + 4) * 10) / 10),
      duration: Math.max(10, Math.round((Math.random() * 25 + 10))),
      hazards: Math.max(2, Math.round(Math.random() * 8)),
      safetyScore: Math.max(60, Math.round(Math.random() * 30 + 65)),
    }));
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <main style={{ height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 1000 }}>
        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: '#7EB8A8' }}>📍 Your Location</span>
            <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#E8FFF8' }} value={origin} onChange={(e) => setOrigin(e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: '#7EB8A8' }}>🔴 Enter Destination</span>
            <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#E8FFF8' }} value={destination} onChange={(e) => setDestination(e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ padding: 12, background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={handleSwap}>↕️ Swap</button>
            <button type="button" style={{ padding: 12, background: '#00C9A7', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={handleRoute}>Plan Safe Route</button>
          </div>
        </div>
      </div>
      <div style={{ height: '100%', width: '100%' }} ref={mapRef} />
      <div style={{ position: 'absolute', bottom: 80, left: 20, right: 20, background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#7EB8A8', margin: 0 }}>Distance</p>
            <h3 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>{routeInfo.distance} km</h3>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#7EB8A8', margin: 0 }}>ETA</p>
            <h3 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>{routeInfo.duration} min</h3>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#7EB8A8', margin: 0 }}>Hazards</p>
            <h3 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>{routeInfo.hazards}</h3>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#7EB8A8', margin: 0 }}>Safety</p>
            <h3 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>{routeInfo.safetyScore}/100</h3>
          </div>
        </div>
        <button type="button" style={{ width: '100%', padding: 16, background: '#00C9A7', color: '#060D0D', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>Start Navigation</button>
      </div>
    </main>
  );
}
