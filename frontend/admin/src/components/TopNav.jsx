import { Search, Bell } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext.jsx';

const titles = {
  overview: 'Dashboard Overview',
  map: 'Hazard Map',
  reports: 'Report Review',
  users: 'User Management',
  analytics: 'Analytics',
  settings: 'Settings',
};

export default function TopNav() {
  const { activePage, apiBase } = useAdminContext();

export default function TopNav() {
  const { activePage, apiBase } = useAdminContext();

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{titles[activePage] || 'Admin Console'}</h1>
          <p className="text-sm text-gray-500">Backend: {apiBase || 'Not configured'}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
            <Search size={20} />
          </button>
          <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
            <Bell size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
}
