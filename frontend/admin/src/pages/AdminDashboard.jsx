import { useEffect, useState, useMemo } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Check, X, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [hazards, setHazards] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/events');
        const data = await response.json();
        if (data.events && Array.isArray(data.events)) {
          setHazards(data.events);
        }
        
        // Fetch pending reports from localStorage (user submissions from dashboard)
        const storedData = JSON.parse(localStorage.getItem('roadguard_v1') || '{}');
        const allReports = storedData.reports || [];
        const pendingReports = allReports.filter(r => r.status === 'Pending');
        setReports(pendingReports);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3s for new reports
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = hazards.length;
    const normal = hazards.filter((h) => h.label === 0).length;
    const speedbreaker = hazards.filter((h) => h.label === 1).length;
    const pothole = hazards.filter((h) => h.label === 2).length;
    
    const storedData = JSON.parse(localStorage.getItem('roadguard_v1') || '{}');
    const allReports = storedData.reports || [];
    const pendingReports = allReports.filter(r => r.status === 'Pending').length;
    const solvedReports = allReports.filter(r => r.status === 'Solved').length;
    const ignoredReports = allReports.filter(r => r.status === 'Ignored').length;

    return { total, normal, speedbreaker, pothole, pendingReports, solvedReports, ignoredReports };
  }, [hazards, reports]);

  const handleSolve = (reportId) => {
    const storedData = JSON.parse(localStorage.getItem('roadguard_v1') || '{}');
    const updatedReports = (storedData.reports || []).map(r => 
      r.id === reportId ? { ...r, status: 'Solved' } : r
    );
    storedData.reports = updatedReports;
    localStorage.setItem('roadguard_v1', JSON.stringify(storedData));
    setReports(updatedReports.filter(r => r.status === 'Pending'));
  };

  const handleIgnore = (reportId) => {
    const storedData = JSON.parse(localStorage.getItem('roadguard_v1') || '{}');
    const updatedReports = (storedData.reports || []).map(r => 
      r.id === reportId ? { ...r, status: 'Ignored' } : r
    );
    storedData.reports = updatedReports;
    localStorage.setItem('roadguard_v1', JSON.stringify(storedData));
    setReports(updatedReports.filter(r => r.status === 'Pending'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin mb-4 text-3xl">⚙️</div>
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle size={32} />
          Admin Dashboard
        </h2>
        <p className="text-slate-400 mt-2">Manage hazards, review uploads & approve/ignore reports</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 font-semibold ${
            activeTab === 'overview'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 font-semibold flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          ⏳ Pending Reviews ({reports.length})
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Analytics KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm font-semibold">Total Hazards Detected</p>
              <p className="text-4xl font-bold text-slate-100 mt-2">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-2">From all sources</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm font-semibold">Normal Roads</p>
              <p className="text-4xl font-bold text-teal-400 mt-2">{stats.normal}</p>
              <p className="text-xs text-slate-500 mt-2">
                {stats.total > 0 ? ((stats.normal / stats.total) * 100).toFixed(0) : 0}% of hazards
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm font-semibold">Speed Breakers</p>
              <p className="text-4xl font-bold text-amber-400 mt-2">{stats.speedbreaker}</p>
              <p className="text-xs text-slate-500 mt-2">
                {stats.total > 0 ? ((stats.speedbreaker / stats.total) * 100).toFixed(0) : 0}% of hazards
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm font-semibold">Potholes</p>
              <p className="text-4xl font-bold text-red-400 mt-2">{stats.pothole}</p>
              <p className="text-xs text-slate-500 mt-2">
                {stats.total > 0 ? ((stats.pothole / stats.total) * 100).toFixed(0) : 0}% of hazards
              </p>
            </div>
          </div>

          {/* Report Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-teal-900 to-teal-800 border border-teal-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Check size={28} className="text-teal-300" />
                <div>
                  <p className="text-teal-300 text-sm font-semibold">Reports Solved</p>
                  <p className="text-3xl font-bold text-teal-100 mt-1">{stats.solvedReports}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Clock size={28} className="text-yellow-300" />
                <div>
                  <p className="text-yellow-300 text-sm font-semibold">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-100 mt-1">{stats.pendingReports}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-900 to-red-800 border border-red-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <X size={28} className="text-red-300" />
                <div>
                  <p className="text-red-300 text-sm font-semibold">Reports Ignored</p>
                  <p className="text-3xl font-bold text-red-100 mt-1">{stats.ignoredReports}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp size={24} />
              System Analytics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-slate-400 text-sm">Avg. Confidence</p>
                <p className="text-2xl font-bold text-teal-400 mt-2">87%</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Detection Rate</p>
                <p className="text-2xl font-bold text-teal-400 mt-2">94%</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Processing Speed</p>
                <p className="text-2xl font-bold text-teal-400 mt-2">245ms</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-teal-400 mt-2">1.2K</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PENDING REVIEWS TAB */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
              <Check size={48} className="mx-auto text-teal-400 mb-4" />
              <p className="text-slate-300 text-lg font-semibold">All Clear!</p>
              <p className="text-slate-400 mt-2">No pending reports to review</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-teal-500 transition-colors">
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Image */}
                  {report.image && (
                    <div className="md:col-span-1">
                      <img 
                        src={report.image} 
                        alt={report.type}
                        className="w-full h-32 object-cover rounded-lg border border-slate-600"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className={`${report.image ? 'md:col-span-2' : 'md:col-span-3'}`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-teal-400">{report.type}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.severity === 'High' ? 'bg-red-900 text-red-200' :
                          report.severity === 'Medium' ? 'bg-amber-900 text-amber-200' :
                          'bg-green-900 text-green-200'
                        }`}>
                          {report.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{report.description}</p>
                      <p className="text-xs text-slate-500">📍 {report.location?.address || 'Unknown location'}</p>
                      <p className="text-xs text-slate-500">👤 Reported by: {report.reporter}</p>
                      <p className="text-xs text-slate-500">📊 Confidence: {(report.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-1 flex gap-3">
                    <button
                      onClick={() => handleSolve(report.id)}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      Solve
                    </button>
                    <button
                      onClick={() => handleIgnore(report.id)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
