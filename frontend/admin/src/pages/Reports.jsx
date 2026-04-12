import { useState } from 'react';
import { useAdminContext } from '../context/AdminContext.jsx';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const { reports, markResolved, markInProgress, rejectReport, loading } = useAdminContext();
  const [filter, setFilter] = useState('all');

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status.toLowerCase() === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reports Management</h2>
          <p className="text-gray-600">Review and manage hazard reports</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.description}</div>
                    {report.image && (
                      <div className="text-xs text-gray-500">Has image</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                    </div>
                    {report.address && (
                      <div className="text-xs text-gray-500">{report.address}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {report.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => markInProgress(report._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Clock className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => markResolved(report._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => rejectReport(report._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="w-4 h-4 inline" />
                        </button>
                      </>
                    )}
                    {report.status === 'In Progress' && (
                      <>
                        <button
                          onClick={() => markResolved(report._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => rejectReport(report._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="w-4 h-4 inline" />
                        </button>
                      </>
                    )}
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
                  <td><span className={`status-chip ${statusStyles[report.status] || ''}`}>{report.status}</span></td>
                  <td>{formatDate(report.submittedAt)}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => markResolved(report.id)}>Resolve</button>
                    <button type="button" onClick={() => {
                      const reason = window.prompt('Ignore reason', 'Duplicate or false positive');
                      if (reason) ignoreReport(report.id, reason);
                    }}>Ignore</button>
                    <button type="button" onClick={() => escalateReport(report.id)}>Escalate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="notes-panel card">
        <div className="card-title">Add quick note</div>
        {reports.slice(0, 3).map((report) => (
          <div key={report.id} className="note-row">
            <div>
              <strong>{report.id}</strong>
              <p>{report.type} at {report.location}</p>
            </div>
            <div className="note-actions">
              <textarea
                value={noteInputs[report.id] || ''}
                placeholder="Add admin note"
                onChange={(event) => handleNoteChange(report.id, event.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  addAdminNote(report.id, noteInputs[report.id] || 'Reviewed by admin');
                  setNoteInputs((current) => ({ ...current, [report.id]: '' }));
                }}
              >Save note</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
