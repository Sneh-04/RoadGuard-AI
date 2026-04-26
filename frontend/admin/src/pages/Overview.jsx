import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAdminContext } from '../context/AdminContext.jsx';
import { AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';

const statusColors = {
  pending: '#F59E0B',
  solved: '#2563eb',
  in_progress: '#3B82F6',
  ignored: '#EF4444',
};

export default function Overview() {
  const { analytics, reports, loading, socketStatus, liveStats } = useAdminContext();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const kpis = [
    {
      title: 'Total Reports',
      value: analytics.total_reports || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      title: 'Solved',
      value: analytics.solved || 0,
      icon: CheckCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Pending',
      value: analytics.pending || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      title: 'In Progress',
      value: analytics.in_progress || 0,
      icon: MapPin,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  ];

  const statusData = [
    { name: 'Pending', value: analytics.pending || 0, color: statusColors.pending },
    { name: 'Solved', value: analytics.solved || 0, color: statusColors.solved },
    { name: 'In Progress', value: analytics.in_progress || 0, color: statusColors.in_progress },
    { name: 'Ignored', value: analytics.ignored || 0, color: statusColors.ignored },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Live incident intelligence and system status</p>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[#0f2f2f]/80 p-5 text-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs ${socketStatus === 'connected' ? 'bg-blue-500/15 text-blue-200' : socketStatus === 'connecting' ? 'bg-amber-500/15 text-amber-200' : 'bg-red-500/15 text-red-200'}`}>
            {socketStatus === 'connected' ? 'Live feed connected' : socketStatus === 'connecting' ? 'Connecting to live feed…' : 'Live feed offline'}
          </span>
          <span className="rounded-full bg-slate-900/60 px-3 py-1 text-xs text-slate-200">{liveStats.total || 0} hazards streamed</span>
          <span className="rounded-full bg-slate-900/60 px-3 py-1 text-xs text-slate-200">{liveStats.pothole || 0} potholes</span>
          <span className="rounded-full bg-slate-900/60 px-3 py-1 text-xs text-slate-200">{liveStats.speed_breaker || 0} speed breakers</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-full ${kpi.bg}`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Alerts */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-red-600">🚨 Critical Alerts</h3>
        <div className="space-y-3">
          {reports.filter(r => r.severity === 'High' && r.status === 'pending').slice(0, 5).map((report) => (
            <div key={report._id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center space-x-3">
                {report.image && (
                  <img
                    src={`data:image/jpeg;base64,${report.image}`}
                    alt="Hazard"
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium text-red-800">{report.type || 'Unknown'} Hazard</p>
                  <p className="text-sm text-red-600">{report.address || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}</p>
                  <p className="text-xs text-red-500">{new Date(report.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => {/* markInProgress */}}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Respond
              </button>
            </div>
          ))}
          {reports.filter(r => r.severity === 'High' && r.status === 'pending').length === 0 && (
            <p className="text-gray-500 text-center py-4">No critical alerts at this time</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Daily Reports</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.daily_reports || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Most Affected Areas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Location</th>
                <th className="text-left py-2">Reports</th>
                <th className="text-left py-2">Priority</th>
              </tr>
            </thead>
            <tbody>
              {(analytics.most_affected_areas || []).slice(0, 5).map((area, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{area.latitude?.toFixed(2)}, {area.longitude?.toFixed(2)}</td>
                  <td className="py-2">{area.count}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      area.count > 10 ? 'bg-red-100 text-red-800' :
                      area.count > 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {area.count > 10 ? 'High' : area.count > 5 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
