import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, BarChart3, ArrowLeftRight, Zap } from 'lucide-react';
import Card from './Card';

const AdminLayout = ({ role, setRole }) => {
  const navigate = useNavigate();

  const handleSwitchRole = () => {
    setRole('user');
    navigate('/');
  };

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/sensor-test', label: 'Sensor Test', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="p-4 border-b border-white/10 mb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Admin Portal</p>
            <h1 className="text-3xl font-bold text-white">Safety Operations</h1>
            <p className="text-white/70 mt-2 max-w-2xl">Extended insights and management controls for roads, hazards, and user reporting.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Card className="bg-white/10 rounded-2xl p-3 shadow-none border-white/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-white/60">Current Role</p>
                  <p className="text-lg font-semibold text-white">{role}</p>
                </div>
                <button
                  onClick={handleSwitchRole}
                  className="text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full bg-primary text-black hover:bg-primary/90 transition"
                >
                  Switch to user
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <Card className="space-y-4">
            <div className="text-sm uppercase tracking-[0.2em] text-white/60">Navigation</div>
            <div className="space-y-2">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                      isActive
                        ? 'bg-primary/20 text-primary shadow-lg shadow-primary/20'
                        : 'text-white/70 hover:bg-white/10'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </Card>
          <div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
