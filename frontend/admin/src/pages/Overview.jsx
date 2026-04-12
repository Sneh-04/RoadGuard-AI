import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAdminContext } from '../context/AdminContext.jsx';
import { AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';

const statusColors = {
  Pending: '#F59E0B',
  Resolved: '#22C55E',
  'In Progress': '#3B82F6',
  Rejected: '#EF4444',
};

export default function Overview() {
  const { analytics, reports, loading } = useAdminContext();

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
      title: 'Resolved',
      value: analytics.resolved || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
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
    { name: 'Pending', value: analytics.pending || 0, color: statusColors.Pending },
    { name: 'Resolved', value: analytics.resolved || 0, color: statusColors.Resolved },
    { name: 'In Progress', value: analytics.in_progress || 0, color: statusColors['In Progress'] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Live incident intelligence and system status</p>
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
                      'bg-green-100 text-green-800'
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
              </tbody>
            </table>
          </div>
        </section>

        <section className="card activity-card">
          <div className="card-title">Recent activity</div>
          <div className="activity-stream">
            {activityLog.slice(0, 5).map((item) => (
              <div key={item.id} className="activity-item">
                <div>
                  <p>{item.action} {item.reportType || item.userId ? item.reportType || item.userId : ''}</p>
                  <small>{item.admin} · {timeAgo(item.timestamp)}</small>
                </div>
                <span className="status-chip" style={{ background: statusColors[item.action] || '#2563EB' }}>
                  {item.action}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
