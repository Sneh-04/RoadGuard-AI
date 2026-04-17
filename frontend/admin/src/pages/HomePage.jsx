import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import { CloudRain, MapPin, Sparkles, AlertTriangle } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext.jsx';

const hotspots = [
  { label: 'Marine Drive', delay: '12 min', severity: 'high' },
  { label: 'Poondi Road', delay: '8 min', severity: 'medium' },
  { label: 'City Junction', delay: '4 min', severity: 'low' },
];

const hazards = [
  { type: 'Pothole', severity: 'high', location: 'Anna Salai', reporter: 'Ravi', distance: '350m' },
  { type: 'Speedbump', severity: 'medium', location: 'Opposite Lagoon', reporter: 'Divya', distance: '760m' },
  { type: 'Flooding', severity: 'high', location: 'Mount Road Crossing', reporter: 'Aisha', distance: '1.2km' },
];

export default function HomePage() {
  const { socketStatus, liveHazards } = useAdminContext();
  const liveCardLabel = socketStatus === 'connected' ? 'Live feed' : socketStatus === 'connecting' ? 'Connecting…' : 'Offline';
  const liveSummary = liveHazards.length > 0 ? `${liveHazards.length} recent hazards streamed` : 'Awaiting live hazard updates in the admin console.';

  return (
    <div className="space-y-6 pb-28">
      <header className="rounded-[2rem] border border-white/10 bg-[#102f2f]/90 p-6 shadow-[0_35px_80px_rgba(20,184,166,0.14)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">Road Safety Assistant</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-100 sm:text-4xl">Good Evening, Snehalatha 👋</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base">Markapur, premium road insights for your next ride.</p>
          </div>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-white/5 text-cyan-200 shadow-[0_20px_60px_rgba(20,184,166,0.18)]">
            <CloudRain className="h-7 w-7" />
          </div>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card title="Slippery Roads ⚠️" subtitle="Current weather and slick conditions">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold text-slate-100">24°C</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>Rainy</p>
                <p>Humidity 84%</p>
                <p>Wind 11 km/h</p>
              </div>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-cyan-400/10 text-cyan-200">
              <CloudRain className="h-10 w-10" />
            </div>
          </div>
        </Card>

        <Card title="Live traffic hotspots" subtitle="Monitor delays near your route">
          <div className="space-y-4">
            {hotspots.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-4 transition duration-300 hover:bg-white/10">
                <div>
                  <p className="font-medium text-slate-100">{item.label}</p>
                  <p className="text-sm text-slate-400">Delay {item.delay}</p>
                </div>
                <Badge label={item.severity} variant={item.severity} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Live hazard stream" subtitle={liveSummary}>
          <div className="flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-white/5 px-4 py-4 text-slate-400">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className={`mt-2 font-semibold ${socketStatus === 'connected' ? 'text-emerald-300' : 'text-amber-300'}`}>
                {liveCardLabel}
              </p>
            </div>
            <div className="rounded-full bg-white/5 px-3 py-2 text-sm text-slate-100">{liveHazards.length || 0} hazards</div>
          </div>
          <div className="space-y-4 mt-4">
            {(liveHazards.length > 0 ? liveHazards.slice(0, 3) : hazards).map((hazard) => (
              <div key={hazard.id || hazard.type + hazard.location} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-100">{hazard.type}</p>
                    <p className="mt-1 text-sm text-slate-400">Near {hazard.location || hazard.location || 'local area'}</p>
                  </div>
                  <Badge label={hazard.severity} variant={hazard.severity} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                  <span>{hazard.distance || 'Live'}</span>
                  <span>Reporter: {hazard.reporter || 'Network'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Latest reports" subtitle="Community alerts from nearby drivers">
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
              <p className="font-medium text-slate-100">Community warning near Central Avenue</p>
              <p className="mt-2 text-sm text-slate-400">+12 users reported pothole after storm</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
              <p className="font-medium text-slate-100">Fog advisory on Old Bridge Road</p>
              <p className="mt-2 text-sm text-slate-400">Visibility reduced, drive carefully</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
