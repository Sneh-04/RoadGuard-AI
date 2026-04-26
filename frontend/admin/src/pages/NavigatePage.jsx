import { useState, useEffect } from 'react';
import Card from '../components/Card.jsx';
import MapView from '../components/MapView.jsx';
import Badge from '../components/Badge.jsx';
import { ArrowUpDown, MapPin } from 'lucide-react';

const destinations = [
  { label: 'Anna Salai', eta: '12 min', status: 'Safe' },
  { label: 'Mount Road', eta: '18 min', status: 'Caution' },
];

export default function NavigatePage() {
  const [destination, setDestination] = useState('Chennai Central');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/events');
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="space-y-6 pb-28">
      <Card title="Plan Safe Route" subtitle="Find the clearest path and avoid hazards">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(20,184,166,0.12)] transition duration-300 hover:bg-white/10">
            <label className="text-sm font-medium text-slate-300">Enter destination</label>
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="mt-3 w-full rounded-[1.5rem] border border-white/10 bg-[#0f2f2f] px-4 py-3 text-slate-100 outline-none transition duration-300 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
              placeholder="Enter destination"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="rounded-[1.75rem] bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:bg-white/10">Swap</button>
            <button className="rounded-[1.75rem] bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition duration-300 hover:bg-blue-500/20">Plan Safe Route</button>
          </div>
        </div>
      </Card>

      <MapView events={events} />

      <Card title="Route overview" subtitle="Current hazards and route confidence">
        <div className="space-y-4">
          {destinations.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-white/5 px-4 py-4 transition duration-300 hover:bg-white/10">
              <div>
                <p className="text-base font-semibold text-slate-100">{item.label}</p>
                <p className="text-sm text-slate-400">ETA {item.eta}</p>
              </div>
              <Badge label={item.status} variant={item.status === 'Safe' ? 'active' : 'medium'} />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-[0_20px_40px_rgba(20,184,166,0.1)]">
        <MapPin className="h-5 w-5 text-blue-200" />
        <p>Teal line represents the highlighted safe route on the map.</p>
      </div>
    </div>
  );
}
