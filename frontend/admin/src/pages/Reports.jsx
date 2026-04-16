import { useState } from 'react';
import { useAdminContext } from '../context/AdminContext.jsx';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const { reports, markResolved, markInProgress, rejectReport, loading } = useAdminContext();
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  const filteredReports = reports.filter(report => {
    if (filter !== 'all' && report.status.toLowerCase() !== filter) return false;
    if (severityFilter !== 'all' && report.severity !== severityFilter) return false;
    if (locationFilter && !report.address?.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'solved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'ignored': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
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
            <option value="in_progress">In Progress</option>
            <option value="solved">Solved</option>
            <option value="ignored">Ignored</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Severity</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input
            type="text"
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sensor Data
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
                    {report.image ? (
                      <img
                        src={`data:image/jpeg;base64,${report.image}`}
                        alt="Hazard"
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.type || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.description}</div>
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500">
                      {report.sensor_data ? (
                        <div>
                          <div>Acc: {report.sensor_data.acceleration?.toFixed(2) || 'N/A'}</div>
                          <div>Hist: {report.sensor_data.history?.length || 0} readings</div>
                        </div>
                      ) : (
                        'No data'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {report.status === 'pending' && (
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
                    {report.status === 'in_progress' && (
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
