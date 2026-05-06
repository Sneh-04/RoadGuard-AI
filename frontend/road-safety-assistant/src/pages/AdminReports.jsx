import Card from '../components/Card';
import ReportTable from '../components/ReportTable';

const mockReports = [
  { id: 1, hazard: 'Pothole', location: 'Anna Salai', severity: 'High', status: 'Verified' },
  { id: 2, hazard: 'Flooding', location: 'Adyar', severity: 'Medium', status: 'Pending' },
  { id: 3, hazard: 'Speedbump', location: 'T. Nagar', severity: 'Low', status: 'Verified' },
  { id: 4, hazard: 'Debris', location: 'Guindy', severity: 'High', status: 'Pending' },
];

const AdminReports = () => {
  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Reports</h2>
          <p className="text-white/70">Review status and verify hazard submissions.</p>
        </div>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Review queue</p>
            <p className="mt-2 text-white/70">Approved, pending and urgent hazard reports.</p>
          </div>
          <div className="rounded-2xl p-4 bg-white/5 text-sm text-white/70">
            Tip: Click any report to inspect details and confirm status updates.
          </div>
        </div>
      </Card>

      <ReportTable reports={mockReports} />
    </div>
  );
};

export default AdminReports;
