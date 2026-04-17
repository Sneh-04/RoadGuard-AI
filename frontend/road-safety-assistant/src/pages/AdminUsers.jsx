import Card from '../components/Card';
import Badge from '../components/Badge';

const mockUsers = [
  { id: 1, name: 'Anjali', status: 'Active', role: 'Field Reporter' },
  { id: 2, name: 'Ramesh', status: 'Active', role: 'Community User' },
  { id: 3, name: 'Nivedita', status: 'Inactive', role: 'Admin' },
  { id: 4, name: 'Suresh', status: 'Active', role: 'Moderator' },
];

const AdminUsers = () => {
  return (
    <div className="space-y-4 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Manage Users</h2>
        <p className="text-white/70">View registered users and their activity status.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Active users</p>
          <p className="mt-3 text-3xl font-bold text-white">3,842</p>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">New this week</p>
          <p className="mt-3 text-3xl font-bold text-white">124</p>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Pending approvals</p>
          <p className="mt-3 text-3xl font-bold text-white">9</p>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Admins</p>
          <p className="mt-3 text-3xl font-bold text-white">8</p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-white/70 text-sm">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr key={user.id} className="bg-white/5 rounded-3xl">
                  <td className="px-4 py-4 text-white">{user.name}</td>
                  <td className="px-4 py-4 text-white/70">{user.role}</td>
                  <td className="px-4 py-4">
                    <Badge variant={user.status === 'Active' ? 'high' : 'medium'}>{user.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsers;
