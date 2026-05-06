import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAdminContext } from '../context/AdminContext.jsx';

export default function Analytics() {
  const { analytics } = useAdminContext();

  return (
    <div className="page-analytics">
      <div className="page-header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Performance metrics and trends</h2>
        </div>
      </div>

      <div className="kpi-grid">
        {analytics.kpis.map((metric) => (
          <div key={metric.title} className="card kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">{metric.title}</span>
              <span className="kpi-trend">{metric.trend}</span>
            </div>
            <div className="kpi-value">{metric.value}</div>
            <div className="kpi-subtitle">{metric.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        <section className="card chart-card">
          <div className="card-title">Report flow</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="submitted" stroke="#6366F1" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="resolved" stroke="#22C55E" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="card mini-chart-card">
          <div className="card-title">Type distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={analytics.typeBreakdown} dataKey="count" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {analytics.typeBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="card table-card">
        <div className="card-title">Performance summary</div>
        <div className="analytics-grid">
          <div className="stat-panel">
            <span>Resolution rate</span>
            <strong>{analytics.resolutionRate}%</strong>
          </div>
          <div className="stat-panel">
            <span>Average resolution</span>
            <strong>{analytics.avgResolutionHours} hrs</strong>
          </div>
          <div className="stat-panel">
            <span>Accuracy rate</span>
            <strong>{analytics.accuracyRate}%</strong>
          </div>
          <div className="stat-panel">
            <span>Engagement score</span>
            <strong>{analytics.engagement}/5</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
