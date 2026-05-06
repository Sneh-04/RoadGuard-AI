import Card from './Card';
import Badge from './Badge';

const statusStyles = {
  pending: 'pending',
  resolved: 'resolved',
  ignored: 'ignored',
};

const ReportTable = ({ reports, onResolve, onIgnore }) => {
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full text-left border-separate border-spacing-y-3">
        <thead>
          <tr className="text-white/70 text-sm">
            <th className="px-4 py-3">Image</th>
            <th className="px-4 py-3">Hazard</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Severity</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              className={`bg-white/5 rounded-3xl transition ${
                report.status === 'pending' ? 'border border-red-500/30 shadow-[0_0_20px_rgba(248,113,113,0.12)]' : ''
              }`}
            >
              <td className="px-4 py-4">
                <img src={report.image} alt={report.hazard} className="h-16 w-24 rounded-2xl object-cover" />
              </td>
              <td className="px-4 py-4 text-white">{report.hazardType}</td>
              <td className="px-4 py-4 text-white/70">{report.location}</td>
              <td className="px-4 py-4 text-white">{report.severity}</td>
              <td className="px-4 py-4">
                <Badge variant={statusStyles[report.status] || 'default'}>{report.status}</Badge>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={report.status !== 'pending'}
                    onClick={() => onResolve?.(report.id)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      report.status === 'pending'
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    ✅ Solve
                  </button>
                  <button
                    type="button"
                    disabled={report.status !== 'pending'}
                    onClick={() => onIgnore?.(report.id)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      report.status === 'pending'
                        ? 'bg-red-500 text-black hover:bg-red-400'
                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    ❌ Ignore
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default ReportTable;
