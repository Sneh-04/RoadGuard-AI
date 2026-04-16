import { BarChart3, MapPin, ClipboardList, Users, Gauge, Settings, LogOut } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext.jsx';

const navItems = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'map', label: 'Hazard map', icon: MapPin },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { admin, activePage, setActivePage, logout } = useAdminContext();

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            RG
          </div>
          <div>
            <h1 className="font-bold text-lg">RoadGuard</h1>
            <p className="text-sm text-gray-500">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activePage === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
        <div className="mb-4">
          <p className="font-medium">{admin?.email || 'Admin'}</p>
          <p className="text-sm text-gray-500">Administrator</p>
        </div>
        <button
          type="button"
          className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          onClick={logout}
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
