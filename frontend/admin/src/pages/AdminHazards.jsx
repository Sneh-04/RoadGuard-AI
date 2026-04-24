import { useState, useMemo } from 'react';
import { Trash2, CheckCircle, Eye, Loader } from 'lucide-react';
import { useRealTime } from '../context/RealTimeContext.jsx';

export default function AdminHazards() {
  const { hazards, updateHazardStatus } = useRealTime();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const filteredHazards = useMemo(() => {
    let filtered = hazards;
    
    // Filter by status first (default to pending/active)
    if (filterStatus === 'pending') {
      filtered = filtered.filter((h) => h.status !== 'solved' && h.status !== 'ignored');
    } else if (filterStatus === 'solved') {
      filtered = filtered.filter((h) => h.status === 'solved');
    } else if (filterStatus === 'ignored') {
      filtered = filtered.filter((h) => h.status === 'ignored');
    }
    
    // Then filter by type
    if (filterType === 'all') return filtered;
    return filtered.filter((h) => h.label?.toString() === filterType);
  }, [hazards, filterType, filterStatus]);

  const handleMarkSolved = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    const success = await updateHazardStatus(id, 'solve');
    if (success) {
      console.log(`✅ Hazard ${id} marked as solved`);
    }
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  };

  const handleIgnore = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    const success = await updateHazardStatus(id, 'ignore');
    if (success) {
      console.log(`🗑️ Hazard ${id} ignored`);
    }
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin mb-4 text-3xl">⚙️</div>
          <p className="text-slate-400">Loading hazards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-100">Hazard Management</h2>
        <p className="text-slate-400 mt-2">Review and manage all reported hazards</p>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'pending'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('solved')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'solved'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Solved
        </button>
        <button
          onClick={() => setFilterStatus('ignored')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'ignored'
              ? 'bg-red-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Ignored
        </button>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          All Status
        </button>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterType === 'all'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          All ({hazards.length})
        </button>
        <button
          onClick={() => setFilterType('0')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterType === '0'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Normal ({hazards.filter((h) => h.label === 0).length})
        </button>
        <button
          onClick={() => setFilterType('1')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterType === '1'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Speed Breaker ({hazards.filter((h) => h.label === 1).length})
        </button>
        <button
          onClick={() => setFilterType('2')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterType === '2'
              ? 'bg-red-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Pothole ({hazards.filter((h) => h.label === 2).length})
        </button>
      </div>

      {/* Hazards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHazards.length > 0 ? (
          filteredHazards.map((hazard) => (
            <div
              key={hazard.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              {/* Type Badge */}
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    hazard.label === 0
                      ? 'bg-blue-500/20 text-blue-300'
                      : hazard.label === 1
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {hazard.label === 0 ? 'Normal' : hazard.label === 1 ? 'Speed Breaker' : 'Pothole'}
                </span>
                <span className="text-xs text-slate-500">ID: {hazard.id}</span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 text-sm">
                <div>
                  <p className="text-slate-400">Confidence</p>
                  <p className="text-slate-100 font-semibold">{(hazard.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-slate-400">Location</p>
                  <p className="text-slate-300 font-mono text-xs">
                    {hazard.latitude?.toFixed(4)}, {hazard.longitude?.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Timestamp</p>
                  <p className="text-slate-300 text-xs">
                    {new Date(hazard.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkSolved(hazard.id)}
                  disabled={actionLoading[hazard.id]}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-semibold py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  {actionLoading[hazard.id] ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  {actionLoading[hazard.id] ? 'Updating...' : 'Solved'}
                </button>
                <button
                  onClick={() => handleIgnore(hazard.id)}
                  disabled={actionLoading[hazard.id]}
                  className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-semibold py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  {actionLoading[hazard.id] ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {actionLoading[hazard.id] ? 'Updating...' : 'Ignore'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400">No hazards found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
