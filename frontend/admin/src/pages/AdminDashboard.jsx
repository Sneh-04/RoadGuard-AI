import { useEffect, useState, useMemo } from 'react';
import { BarChart3, AlertTriangle, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHazards = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/events');
        const data = await response.json();
        if (data.events && Array.isArray(data.events)) {
          setHazards(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch hazards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHazards();
  }, []);

  const stats = useMemo(() => {
    const total = hazards.length;
    const normal = hazards.filter((h) => h.label === 0).length;
    const speedbreaker = hazards.filter((h) => h.label === 1).length;
    const pothole = hazards.filter((h) => h.label === 2).length;

    return { total, normal, speedbreaker, pothole };
  }, [hazards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin mb-4 text-3xl">⚙️</div>
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle size={32} />
          Admin Dashboard
        </h2>
        <p className="text-slate-400 mt-2">Manage and monitor all road hazards</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm font-semibold">Total Hazards</p>
          <p className="text-4xl font-bold text-slate-100 mt-2">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-2">All recorded incidents</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm font-semibold">Normal Roads</p>
          <p className="text-4xl font-bold text-teal-400 mt-2">{stats.normal}</p>
          <p className="text-xs text-slate-500 mt-2">
            {stats.total > 0 ? ((stats.normal / stats.total) * 100).toFixed(0) : 0}% of total
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm font-semibold">Speed Breakers</p>
          <p className="text-4xl font-bold text-amber-400 mt-2">{stats.speedbreaker}</p>
          <p className="text-xs text-slate-500 mt-2">
            {stats.total > 0 ? ((stats.speedbreaker / stats.total) * 100).toFixed(0) : 0}% of total
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 text-sm font-semibold">Potholes</p>
          <p className="text-4xl font-bold text-red-400 mt-2">{stats.pothole}</p>
          <p className="text-xs text-slate-500 mt-2">
            {stats.total > 0 ? ((stats.pothole / stats.total) * 100).toFixed(0) : 0}% of total
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-lg transition-colors">
          ✅ Mark Solved
        </button>
        <button className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-4 rounded-lg transition-colors">
          👁️ View Details
        </button>
        <button className="bg-red-700 hover:bg-red-800 text-white font-semibold py-4 rounded-lg transition-colors">
          🗑️ Ignore Report
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Recent Activity
        </h3>
        <p className="text-slate-400 text-sm">Navigate to Hazard Management to view detailed list and perform actions</p>
      </div>
    </div>
  );
}
