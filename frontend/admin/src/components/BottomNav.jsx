import { Home, AlertTriangle, Compass, Activity, User } from 'lucide-react';

const navItems = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'report', label: 'Report', icon: AlertTriangle },
  { key: 'navigate', label: 'Navigate', icon: Compass },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0f2f2f]/95 backdrop-blur-xl px-4 py-3 shadow-[0_-20px_80px_rgba(0,0,0,0.35)] sm:hidden">
      <div className="grid grid-cols-5 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`group flex flex-col items-center justify-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold transition duration-300 ${isActive ? 'bg-cyan-400/15 text-cyan-200 shadow-[0_10px_30px_rgba(20,184,166,0.24)]' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
