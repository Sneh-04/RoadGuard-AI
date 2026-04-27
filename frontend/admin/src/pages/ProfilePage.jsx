import { useState } from 'react';
import Card from '../components/Card.jsx';
import StatCard from '../components/StatCard.jsx';
import BadgeCard from '../components/BadgeCard.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import { UserCircle2, Mail, MapPin, Smartphone } from 'lucide-react';

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [backendUrl, setBackendUrl] = useState('http://localhost:8002/api');

  return (
    <div className="space-y-6 pb-28">
      <Card className="p-6">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-[#0f2f2f]/80 p-6 shadow-[0_30px_80px_rgba(20,184,166,0.16)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-teal-200 shadow-[0_20px_40px_rgba(0,201,167,0.12)]">
              <UserCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">Snehalatha</h1>
              <p className="mt-1 text-sm text-slate-400 flex items-center gap-2"><Mail className="h-4 w-4 text-teal-200" /> snehalatha@example.com</p>
              <p className="mt-1 text-sm text-slate-400 flex items-center gap-2"><Smartphone className="h-4 w-4 text-teal-200" /> +91 98765 43210</p>
              <p className="mt-1 text-sm text-slate-400 flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-200" /> Markapur • Bike</p>
            </div>
          </div>
          <div className="grid w-full gap-4 sm:w-auto sm:grid-cols-3">
            <StatCard label="Reports" value="46" />
            <StatCard label="Active" value="18" />
            <StatCard label="Users helped" value="1240" />
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Your milestone progress</h2>
            <p className="text-sm text-slate-400">Track your achievements and community reputation.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <BadgeCard title="First Report" description="First time sharing a hazard" unlocked />
          <BadgeCard title="Road Warrior" description="10+ reports submitted" />
          <BadgeCard title="Community Helper" description="5+ verifications" />
          <BadgeCard title="Top Reporter" description="Featured in community alert" />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Manage your RoadGuard profile</h2>
          <p className="text-sm text-slate-400">Control notifications, appearance, and API settings.</p>
        </div>
        <div className="grid gap-4">
          <ToggleSwitch label="Notifications" checked={notifications} onChange={setNotifications} />
          <ToggleSwitch label="Dark Mode" checked={darkMode} onChange={setDarkMode} />
          <Card className="p-4">
            <label className="block text-sm font-medium text-slate-300">Backend URL</label>
            <input
              className="mt-3 w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition duration-300 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
              value={backendUrl}
              onChange={(event) => setBackendUrl(event.target.value)}
              placeholder="http://localhost:8002/api"
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
