import { useState, useEffect } from 'react';
import { Trash2, CheckCircle, Loader } from 'lucide-react';

export default function AdminHazards() {
  const [hazards, setHazards] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchHazards();
    const interval = setInterval(fetchHazards, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchHazards = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/events');
      const data = await res.json();
      console.log('📍 Hazards fetched:', data);
      setHazards(data.events || []);
    } catch (err) {
      console.error('❌ Error fetching hazards:', err);
    }
  };

  const filteredHazards = filterStatus === 'all' 
    ? hazards 
    : hazards.filter(h => h.status === filterStatus.toUpperCase());

  const solve = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await fetch(`http://localhost:8000/api/events/${id}/solve`, {
        method: 'PATCH'
      });
      console.log(`✅ Hazard ${id} marked as solved`);
      await fetchHazards();
    } catch (err) {
      console.error('❌ Error solving hazard:', err);
    }
    setActionLoading(prev => ({ ...prev, [id]: false }));
  };

  const ignore = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await fetch(`http://localhost:8000/api/events/${id}/ignore`, {
        method: 'PATCH'
      });
      console.log(`🗑️ Hazard ${id} ignored`);
      await fetchHazards();
    } catch (err) {
      console.error('❌ Error ignoring hazard:', err);
    }
    setActionLoading(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-100">Hazard Management</h2>
        <p className="text-slate-400 mt-2">Review and manage all reported hazards</p>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'ACTIVE', 'SOLVED', 'IGNORED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === status
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {status === 'all' ? 'All Status' : status}
          </button>
        ))}
      </div>

      {/* Hazards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHazards.length > 0 ? (
          filteredHazards.map((hazard) => (
            <div
              key={hazard.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3"
            >
              {/* Label Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  hazard.label === 'POTHOLE'
                    ? 'bg-red-900 text-red-100'
                    : 'bg-amber-900 text-amber-100'
                }`}>
                  {hazard.label}
                </span>
                <span className={`text-xs font-semibold ${
                  hazard.status === 'ACTIVE'
                    ? 'text-teal-400'
                    : hazard.status === 'SOLVED'
                    ? 'text-green-400'
                    : 'text-gray-400'
                }`}>
                  {hazard.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1 text-sm">
                <p className="text-slate-300">ID: <span className="text-teal-400">#{hazard.id}</span></p>
                <p className="text-slate-300">
                  Location: <span className="text-slate-400">{hazard.latitude?.toFixed(4) || 'N/A'}, {hazard.longitude?.toFixed(4) || 'N/A'}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => solve(hazard.id)}
                  disabled={actionLoading[hazard.id] || hazard.status === 'SOLVED'}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    actionLoading[hazard.id]
                      ? 'bg-teal-600/50 text-teal-200'
                      : hazard.status === 'SOLVED'
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {actionLoading[hazard.id] ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Solve
                </button>
                <button
                  onClick={() => ignore(hazard.id)}
                  disabled={actionLoading[hazard.id] || hazard.status === 'IGNORED'}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    actionLoading[hazard.id]
                      ? 'bg-red-600/50 text-red-200'
                      : hazard.status === 'IGNORED'
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {actionLoading[hazard.id] ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Ignore
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400">No hazards found</p>
          </div>
        )}
      </div>
    </div>
  );
}
