import { Bell, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitle = {
  '/': 'Dashboard',
  '/upload': 'Upload Hazard',
  '/map': 'Hazard Map',
  '/analytics': 'Analytics',
  '/profile': 'Profile',
  '/admin': 'Admin Dashboard',
  '/admin/hazards': 'Hazard Management',
};

export default function TopNav({ isAdmin, onAdminToggle }) {
  const location = useLocation();
  const title = pageTitle[location.pathname] || 'RoadGuard';

  return (
    <header className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 shadow-lg">
      <div className="flex items-center justify-between px-6 py-4 max-w-full md:max-w-[calc(100%-256px)]">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin ? '🛡️ Admin Mode Active' : 'User Mode'}
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Bell size={20} className="text-slate-300" />
          </button>
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Settings size={20} className="text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
