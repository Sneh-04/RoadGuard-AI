import { useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useRealTime } from '../context/RealTimeContext.jsx';

export default function AnalyticsPage() {
  const { hazards } = useRealTime();

  const stats = useMemo(() => {
    const total = hazards.length;
    const normal = hazards.filter((h) => h.label === 0).length;
    const speedbreaker = hazards.filter((h) => h.label === 1).length;
    const pothole = hazards.filter((h) => h.label === 2).length;
    const avgConfidence = hazards.length
      ? (hazards.reduce((sum, h) => sum + (h.confidence || 0), 0) / hazards.length * 100).toFixed(1)
      : 0;

    return {
      total,
      normal,
      speedbreaker,
      pothole,
      avgConfidence,
    };
  }, [hazards]);

  const recentHazards = useMemo(() => {
    return hazards.slice(0, 10).map((h) => ({
      id: h.id,
      type: h.label === 0 ? 'Normal' : h.label === 1 ? 'Speed Breaker' : 'Pothole',
      confidence: (h.confidence * 100).toFixed(1),
      timestamp: new Date(h.timestamp).toLocaleString(),
      location: `${h.latitude?.toFixed(4)}, ${h.longitude?.toFixed(4)}`,
    }));
  }, [hazards]);

  if (hazards.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 size={32} />
            Analytics Dashboard
          </h2>
          <p className="text-slate-400 mt-2">
            Real-time statistics and hazard analysis
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400">No hazards detected yet. Upload images to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 size={32} />
          Analytics Dashboard
        </h2>
        <p className="text-slate-400 mt-2">
          Real-time statistics and hazard analysis
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hazards */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-semibold">Total Hazards</p>
              <p className="text-4xl font-bold text-slate-100 mt-2">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-2">All detected hazards</p>
            </div>
            <div className="text-3xl">📍</div>
          </div>
        </div>

        {/* Normal */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-semibold">Normal Roads</p>
              <p className="text-4xl font-bold text-teal-400 mt-2">{stats.normal}</p>
              <p className="text-xs text-slate-500 mt-2">
                {stats.total > 0 ? ((stats.normal / stats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className="text-3xl">🟦</div>
          </div>
        </div>

        {/* Speed Breaker */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-semibold">Speed Breakers</p>
              <p className="text-4xl font-bold text-amber-400 mt-2">{stats.speedbreaker}</p>
              <p className="text-xs text-slate-500 mt-2">
                {stats.total > 0
                  ? ((stats.speedbreaker / stats.total) * 100).toFixed(1)
                  : 0}% of total
              </p>
            </div>
            <div className="text-3xl">🟧</div>
          </div>
        </div>

        {/* Pothole */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-semibold">Potholes</p>
              <p className="text-4xl font-bold text-red-400 mt-2">{stats.pothole}</p>
              <p className="text-xs text-slate-500 mt-2">
                {stats.total > 0 ? ((stats.pothole / stats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className="text-3xl">🟥</div>
          </div>
        </div>

        {/* Avg Confidence */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-semibold">Avg Confidence</p>
              <p className="text-4xl font-bold text-teal-400 mt-2">{stats.avgConfidence}%</p>
              <p className="text-xs text-slate-500 mt-2">Detection accuracy</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
      </div>

      {/* Recent Hazards Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp size={24} />
            Recent Detections
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50 border-b border-slate-700">
                <th className="px-6 py-3 text-left text-slate-300 font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-slate-300 font-semibold">Confidence</th>
                <th className="px-6 py-3 text-left text-slate-300 font-semibold">Location</th>
                <th className="px-6 py-3 text-left text-slate-300 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentHazards.length > 0 ? (
                recentHazards.map((hazard) => (
                  <tr key={hazard.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="px-6 py-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-200">
                        {hazard.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-300">{hazard.confidence}%</td>
                    <td className="px-6 py-3 text-slate-400 text-xs font-mono">{hazard.location}</td>
                    <td className="px-6 py-3 text-slate-400 text-xs">{hazard.timestamp}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    No hazards detected yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
