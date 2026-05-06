import { useState } from 'react';
import { useAdminContext } from '../context/AdminContext.jsx';
import { formatNumber } from '../utils/helpers.js';

export default function Users() {
  const { users, suspendUser } = useAdminContext();
  const [reasonText, setReasonText] = useState({});

  return (
    <div className="page-users">
      <div className="page-header">
        <div>
          <p className="eyebrow">User management</p>
          <h2>Manage contributors and engagement</h2>
        </div>
      </div>

      <div className="card user-summary-grid">
        <div className="summary-card">
          <span>Total users</span>
          <strong>{formatNumber(users.length)}</strong>
        </div>
        <div className="summary-card">
          <span>Active today</span>
          <strong>{formatNumber(users.filter((user) => user.status === 'Active').length)}</strong>
        </div>
        <div className="summary-card">
          <span>Reported hazards</span>
          <strong>{formatNumber(users.reduce((sum, user) => sum + user.reports, 0))}</strong>
        </div>
      </div>

      <div className="table-card card">
        <div className="card-title">Registered users</div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>City</th>
                <th>Reports</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.city}</td>
                  <td>{user.reports}</td>
                  <td>
                    <span className={`status-chip ${user.status === 'Active' ? 'status-resolved' : 'status-ignored'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <textarea
                      className="user-reason"
                      placeholder="Suspend reason"
                      value={reasonText[user.id] || ''}
                      onChange={(event) => setReasonText((current) => ({ ...current, [user.id]: event.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const reason = reasonText[user.id] || 'Policy violation';
                        suspendUser(user.id, reason);
                        setReasonText((current) => ({ ...current, [user.id]: '' }));
                      }}
                    >Suspend</button>
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
