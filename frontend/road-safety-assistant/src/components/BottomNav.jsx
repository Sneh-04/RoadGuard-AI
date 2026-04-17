import { NavLink } from 'react-router-dom';
import { Home, AlertTriangle, Map, Activity, User } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/report', icon: AlertTriangle, label: 'Report' },
    { to: '/navigate', icon: Map, label: 'Navigate' },
    { to: '/activity', icon: Activity, label: 'Activity' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-white/10">
      <div className="flex justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'text-primary bg-primary/20 shadow-lg shadow-primary/50'
                  : 'text-white/70 hover:text-white'
              }`
            }
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;