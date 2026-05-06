import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import { useAdminContext } from '../context/AdminContext.jsx';
import { Sparkles, MapPin, AlertTriangle } from 'lucide-react';

export default function ActivityPage() {
  const { socketStatus, liveHazards, liveStats, activityLog, loading } = useAdminContext();

  const connectionLabel = socketStatus === 'connected'
    ? 'Live feed connected'
    : socketStatus === 'connecting'
      ? 'Connecting…'
      : 'Live feed offline';

  const summaryCards = [
    { label: 'Hazards streamed', value: liveStats.total || liveHazards.length || 0, icon: Sparkles, variant: 'active' },
    { label: 'Potholes', value: liveStats.pothole || 0, icon: AlertTriangle, variant: 'high' },
    { label: 'Speed breakers', value: liveStats.speed_breaker || 0, icon: MapPin, variant: 'medium' },
    { label: 'Normal reads', value: liveStats.normal || 0, icon: Sparkles, variant: 'low' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="rounded-[2rem] border border-white/10 bg-[#102f2f]/90 p-6 shadow-[0_35px_80px_rgba(20,184,166,0.14)] backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-200/70">Activity Dashboard</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-100">Live hazard activity</h2>
        <p className="mt-2 text-sm text-slate-400">Monitor the stream of recent hazard reports coming through the network.</p>
        <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">
          {connectionLabel}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label} title={item.label} className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-4xl font-semibold text-slate-100">{item.value}</p>
              <span className="rounded-full bg-white/5 p-3 text-teal-200">
                <item.icon className="h-6 w-6" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Recent live events" subtitle="Most recent streamed hazard reports">
          <div className="space-y-3">
            {liveHazards.slice(0, 5).map((hazard) => (
              <div key={hazard.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-100">{hazard.type}</p>
                    <p className="mt-1 text-sm text-slate-400">{hazard.location}</p>
                  </div>
                  <Badge label={hazard.severity} variant={hazard.severity} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>{new Date(hazard.timestamp).toLocaleTimeString()}</span>
                  <span>{hazard.reporter}</span>
                </div>
              </div>
            ))}
            {liveHazards.length === 0 && (
              <p className="text-sm text-slate-400">No live events yet. Waiting for backend hazard stream.</p>
            )}
          </div>
        </Card>

        <Card title="Activity log" subtitle="Recent system activity from live stream">
          <div className="space-y-3">
            {activityLog.slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="text-slate-100">{entry.message}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            ))}
            {activityLog.length === 0 && (
              <p className="text-sm text-slate-400">No activity captured yet.</p>
            )}
          </div>
        </Card>

        <Card title="Live hazard feed" subtitle="Stream health and event count">
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Connection</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">{connectionLabel}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Hazard events streamed</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">{liveStats.total || 0}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
