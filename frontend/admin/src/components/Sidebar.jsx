import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, Map, BarChart3, User, Shield, Menu } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/', admin: false },
  { label: 'Upload', icon: Upload, path: '/upload', admin: false },
  { label: 'Map', icon: Map, path: '/map', admin: false },
  { label: 'Analytics', icon: BarChart3, path: '/analytics', admin: false },
  { label: 'Profile', icon: User, path: '/profile', admin: false },
  { label: 'Admin', icon: Shield, path: '/admin', admin: true },
];

export default function Sidebar({ isAdmin, onAdminToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const visibleItems = navItems.filter(item => {
    if (isAdmin) return true;
    return !item.admin;
  });

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 h-screen bg-slate-800 border-r border-slate-700 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } z-40 md:z-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-teal-400">RoadGuard</h1>
          <p className="text-xs text-slate-400 mt-1">AI Road Safety</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Toggle */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={() => {
              onAdminToggle(!isAdmin);
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isAdmin
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {isAdmin ? '👤 User Mode' : '🛡️ Admin Mode'}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
