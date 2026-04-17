import { useEffect, useState } from 'react';
import Card from './Card';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import ReportTable from './ReportTable';
import { AlertTriangle, ShieldCheck, Users, Clock4, Activity, MapPin } from 'lucide-react';

const defaultReports = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1519340333755-59e2469bb3c2?auto=format&fit=crop&w=320&q=80',
    hazardType: 'Pothole',
    severity: 'High',
    location: 'Anna Salai',
    description: 'Large crater creating hazardous conditions for vehicles.',
    status: 'pending',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80',
    hazardType: 'Flooding',
    severity: 'Medium',
    location: 'Adyar',
    description: 'Road section covered with water after heavy rain.',
    status: 'resolved',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=320&q=80',
    hazardType: 'Speedbump',
    severity: 'Low',
    location: 'T. Nagar',
    description: 'Temporary speedbump placed for a local event.',
    status: 'ignored',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=320&q=80',
    hazardType: 'Debris',
    severity: 'High',
    location: 'Guindy',
    description: 'Loose debris on the road after a vehicle accident.',
    status: 'pending',
  },
];

const AdminDashboard = () => {
  const [reports, setReports] = useState(() => {
    const stored = window.localStorage.getItem('reports');
    return stored ? JSON.parse(stored) : defaultReports;
  });
  const [toast, setToast] = useState('');
  const timelinePoints = [20, 40, 25, 55, 50, 70, 60];

  useEffect(() => {
    window.localStorage.setItem('reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(handle);
  }, [toast]);

  const pendingAlerts = reports.filter((report) => report.status === 'pending');

  const handleResolve = (id) => {
    setReports((prev) => prev.map((report) => (report.id === id ? { ...report, status: 'resolved' } : report)));
    setToast('Hazard marked as resolved');
  };

  const handleIgnore = (id) => {
    setReports((prev) => prev.map((report) => (report.id === id ? { ...report, status: 'ignored' } : report)));
    setToast('Hazard ignored');
  };

  return (
    <div className="space-y-6 pb-8">
      {toast && (
        <div className="fixed right-4 top-24 z-50 rounded-3xl border border-white/10 bg-slate-950/90 px-5 py-4 shadow-2xl shadow-black/20">
          <p className="text-sm text-white">{toast}</p>
        </div>
      )}

      <Card className="border-red-500/30 shadow-[0_0_25px_rgba(248,113,113,0.18)] bg-[#1f131f]/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 text-2xl">⚠️</span>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-red-300">Pending Alerts</p>
              <h2 className="text-2xl font-semibold text-white">{pendingAlerts.length} hazards require review</h2>
              <p className="text-white/70 mt-2">Priority actions for unresolved hazard reports.</p>
            </div>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-sm text-white/70">Top pending locations</p>
            <p className="text-base text-white">{pendingAlerts.map((alert) => alert.location).join(', ') || 'No pending alerts'}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Reports" value={reports.length.toString()} icon={AlertTriangle} />
        <StatCard title="Active Hazards" value={reports.filter((report) => report.status === 'pending').length.toString()} icon={MapPin} />
        <StatCard title="Resolved Reports" value={reports.filter((report) => report.status === 'resolved').length.toString()} icon={ShieldCheck} />
        <StatCard title="Users Registered" value="4,560" icon={Users} />
        <StatCard title="Reports Today" value="84" icon={Clock4} />
        <StatCard title="High Severity Alerts" value={reports.filter((report) => report.severity === 'High').length.toString()} icon={Activity} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <ChartCard title="Reports over time" subtitle="Last 7 days" className="lg:col-span-2 xl:col-span-2">
          <div className="h-48">
            <svg viewBox="0 0 300 120" className="w-full h-full">
              <path
                d="M10 100 C 60 80, 90 40, 120 60 S 180 80, 220 50 S 280 20, 290 40"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {timelinePoints.map((point, index) => (
                <circle
                  key={index}
                  cx={20 + index * 40}
                  cy={120 - point}
                  r="4"
                  fill="#38bdf8"
                />
              ))}
            </svg>
          </div>
        </ChartCard>

        <ChartCard title="Hazard type distribution" subtitle="Mock data" className="lg:col-span-1 xl:col-span-2">
          <div className="flex flex-col items-center gap-4">
            <svg viewBox="0 0 120 120" className="w-40 h-40">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#f97316" strokeWidth="100" strokeDasharray="80 220" strokeDashoffset="25" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#22c55e" strokeWidth="100" strokeDasharray="60 240" strokeDashoffset="-55" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#38bdf8" strokeWidth="100" strokeDasharray="40 260" strokeDashoffset="105" transform="rotate(-90 60 60)" />
            </svg>
            <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-400" /> Pothole</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Flooding</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-400" /> Speedbump</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-400" /> Other</div>
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">All reports</h2>
            <p className="text-sm text-white/70">Full hazard report management and status actions.</p>
          </div>
        </div>
        <ReportTable reports={reports} onResolve={handleResolve} onIgnore={handleIgnore} />
      </div>
    </div>
  );
};

export default AdminDashboard;
