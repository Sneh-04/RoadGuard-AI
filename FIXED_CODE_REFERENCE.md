# RoadGuard-AI: Fixed Code Reference

## 1. FIXED IMAGE UPLOAD CODE

**File:** `frontend/admin/src/pages/UploadPage.jsx`

### Key Features:
- ✅ Drag-and-drop support
- ✅ Image preview display
- ✅ Base64 encoding
- ✅ Real-time integration
- ✅ Auto-dismiss success message

### Code Snippet:
```javascript
import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useRealTime } from '../context/RealTimeContext.jsx';

export default function UploadPage() {
  const { addHazard } = useRealTime();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-cyan-500', 'bg-slate-700/50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-cyan-500', 'bg-slate-700/50');
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(droppedFiles[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const response = await fetch('http://localhost:8000/api/predict-video-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64 }),
        });

        if (!response.ok) throw new Error(`Backend error: ${response.status}`);

        const data = await response.json();
        setResult(data);
        setFile(null);
        setPreview(null);

        if (data.event) {
          addHazard(data.event); // Add to real-time stream
        }

        // Auto-dismiss after 5 seconds
        setTimeout(() => setResult(null), 5000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('❌ Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Two Column Layout: Upload Area + Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Area with Drag-Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={(e) => e.currentTarget.classList.remove('border-cyan-500')}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer"
        >
          <Upload size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-100 font-semibold">Click to upload or drag & drop</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result);
                reader.readAsDataURL(f);
              }
            }}
            className="hidden"
          />
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
            <img src={preview} alt="Preview" className="w-full h-full object-cover max-h-80" />
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
      >
        {loading ? (
          <>
            <Loader size={20} className="animate-spin" />
            Processing Image...
          </>
        ) : (
          <>
            <Upload size={20} />
            Upload & Analyze
          </>
        )}
      </button>

      {/* Success Message with Auto-Dismiss */}
      {result && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 mt-6">
          <CheckCircle size={20} className="text-green-500" />
          <p className="text-green-400 font-semibold mt-2">✅ Analysis Complete</p>
          <p className="text-green-300 text-sm mt-1">Image processed and saved to database</p>
          {result.detections?.length > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              📍 {result.detections.length} hazard(s) added to map and admin dashboard
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 2. FIXED MAP CODE

**File:** `frontend/admin/src/pages/MapPage.jsx`

### Key Features:
- ✅ Real-time hazard markers
- ✅ Color-coded by type
- ✅ Live stats bar
- ✅ Connection status indicator
- ✅ Leaflet integration

### Code Snippet:
```javascript
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealTime } from '../context/RealTimeContext.jsx';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getHazardColor = (label) => {
  if (label === 0 || label === 'Normal') return '#3B82F6';     // Blue
  if (label === 1 || label === 'Speed Breaker') return '#F59E0B'; // Amber
  if (label === 2 || label === 'Pothole') return '#EF4444';    // Red
  return '#6B7280'; // Default
};

const createHazardIcon = (label) => {
  const color = getHazardColor(label);
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
    className: 'hazard-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function MapPage() {
  const { hazards, connectionStatus } = useRealTime(); // Use real-time context

  // Calculate map center
  const center = useMemo(() => {
    if (hazards.length === 0) return [13.0827, 80.2707]; // Chennai default
    const avgLat = hazards.reduce((sum, h) => sum + (h.latitude || 13.0827), 0) / hazards.length;
    const avgLng = hazards.reduce((sum, h) => sum + (h.longitude || 80.2707), 0) / hazards.length;
    return [avgLat, avgLng];
  }, [hazards]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: hazards.length,
      normal: hazards.filter((h) => h.label === 0).length,
      speedbreaker: hazards.filter((h) => h.label === 1).length,
      pothole: hazards.filter((h) => h.label === 2).length,
    };
  }, [hazards]);

  return (
    <div className="h-full flex flex-col">
      {/* Stats Bar */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Total</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{stats.total}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Normal</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.normal}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Speed Breaker</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{stats.speedbreaker}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Pothole</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.pothole}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-semibold">Status</p>
            <p className={`text-sm font-bold mt-1 ${connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {connectionStatus === 'connected' ? '🟢 Live' : '🟡 Connecting'}
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {hazards.map((hazard) => (
            <Marker
              key={hazard.id}
              position={[hazard.latitude || 13.0827, hazard.longitude || 80.2707]}
              icon={createHazardIcon(hazard.label)}
            >
              <Popup>
                <div className="text-sm space-y-1 text-slate-900">
                  <p className="font-bold">{hazard.label_name || 'Hazard'}</p>
                  <p>Confidence: {(hazard.confidence * 100).toFixed(1)}%</p>
                  <p className="text-xs text-slate-600">
                    {new Date(hazard.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">
                    Status: {hazard.status || 'active'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
```

---

## 3. FIXED ADMIN DASHBOARD CODE

**File:** `frontend/admin/src/pages/AdminHazards.jsx`

### Key Features:
- ✅ Status filtering (Pending, Solved, Ignored)
- ✅ Type filtering (Normal, Speed Breaker, Pothole)
- ✅ Real-time action buttons (Solve, Ignore)
- ✅ Loading states with spinners
- ✅ Clean admin-only UI

### Code Snippet:
```javascript
import { useState, useMemo } from 'react';
import { Trash2, CheckCircle, Loader } from 'lucide-react';
import { useRealTime } from '../context/RealTimeContext.jsx';

export default function AdminHazards() {
  const { hazards, updateHazardStatus } = useRealTime();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending'); // Default: pending
  const [actionLoading, setActionLoading] = useState({});

  // Filter hazards by status and type
  const filteredHazards = useMemo(() => {
    let filtered = hazards;
    
    // Status filter
    if (filterStatus === 'pending') {
      filtered = filtered.filter((h) => h.status !== 'solved' && h.status !== 'ignored');
    } else if (filterStatus !== 'all') {
      filtered = filtered.filter((h) => h.status === filterStatus);
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((h) => h.label?.toString() === filterType);
    }
    
    return filtered;
  }, [hazards, filterType, filterStatus]);

  // Admin actions with backend sync
  const handleMarkSolved = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    await updateHazardStatus(id, 'solve');
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  };

  const handleIgnore = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    await updateHazardStatus(id, 'ignore');
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-100">Hazard Management</h2>
        <p className="text-slate-400 mt-2">Review and manage all reported hazards</p>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'solved', 'ignored', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              filterStatus === status
                ? status === 'pending' ? 'bg-cyan-600' : status === 'solved' ? 'bg-emerald-600' : status === 'ignored' ? 'bg-red-600' : 'bg-purple-600'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            } text-white`}
          >
            {status === 'all' ? 'All Status' : status}
          </button>
        ))}
      </div>

      {/* Type Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', '0', '1', '2'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === type
                ? type === 'all' ? 'bg-cyan-600' : type === '0' ? 'bg-blue-600' : type === '1' ? 'bg-amber-600' : 'bg-red-600'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            } text-white`}
          >
            {type === 'all' ? 'All' : type === '0' ? 'Normal' : type === '1' ? 'Speed Breaker' : 'Pothole'}
          </button>
        ))}
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
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  hazard.label === 0 ? 'bg-blue-500/20 text-blue-300'
                  : hazard.label === 1 ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-red-500/20 text-red-300'
                }`}>
                  {hazard.label === 0 ? 'Normal' : hazard.label === 1 ? 'Speed Breaker' : 'Pothole'}
                </span>
                <span className="text-xs text-slate-500">ID: {hazard.id}</span>
              </div>

              {/* Hazard Details */}
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
                  <p className="text-slate-400">Status</p>
                  <p className="text-slate-300 text-xs capitalize">{hazard.status || 'active'}</p>
                </div>
              </div>

              {/* Action Buttons with Loading State */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkSolved(hazard.id)}
                  disabled={actionLoading[hazard.id]}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white text-xs font-semibold py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  {actionLoading[hazard.id] ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Solve
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleIgnore(hazard.id)}
                  disabled={actionLoading[hazard.id]}
                  className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-slate-700 text-white text-xs font-semibold py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  {actionLoading[hazard.id] ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Ignore
                    </>
                  )}
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
```

---

## 4. BACKEND ADMIN ACTION ENDPOINTS

**File:** `backend/main.py`

```python
# ── Admin Action: Mark Hazard as Solved ────────────────────────────────────
@app.patch("/api/events/{event_id}/solve")
async def solve_hazard(event_id: int):
    """Mark a hazard as solved by admin."""
    for e in _events:
        if e["id"] == event_id:
            e["status"] = "solved"
            # Broadcast to all connected WebSocket clients
            await manager.broadcast({
                "type": "event_status_updated",
                "event_id": event_id,
                "status": "solved",
                "event": e
            })
            return {"status": "success", "message": "Hazard marked as solved", "event": e}
    raise HTTPException(404, f"Event {event_id} not found")


# ── Admin Action: Mark Hazard as Ignored ───────────────────────────────────
@app.patch("/api/events/{event_id}/ignore")
async def ignore_hazard(event_id: int):
    """Mark a hazard as ignored by admin."""
    for e in _events:
        if e["id"] == event_id:
            e["status"] = "ignored"
            # Broadcast to all connected WebSocket clients
            await manager.broadcast({
                "type": "event_status_updated",
                "event_id": event_id,
                "status": "ignored",
                "event": e
            })
            return {"status": "success", "message": "Hazard marked as ignored", "event": e}
    raise HTTPException(404, f"Event {event_id} not found")
```

---

## 5. REALTIME CONTEXT UPDATES

**File:** `frontend/admin/src/context/RealTimeContext.jsx`

```javascript
// Handle new WebSocket message
currentSocket.addEventListener('message', (event) => {
  try {
    const data = JSON.parse(event.data);

    // Handle new hazard detection
    if (data.type === 'new_event' && data.event) {
      console.log('📍 New hazard received:', data.event);
      setHazards((prev) => [data.event, ...prev].slice(0, 500));
    }
    // Handle status update (admin action)
    else if (data.type === 'event_status_updated' && data.event_id) {
      console.log(`📝 Hazard ${data.event_id} status updated to: ${data.status}`);
      setHazards((prev) =>
        prev.map((h) =>
          h.id === data.event_id ? { ...h, status: data.status } : h
        )
      );
    }
    // Handle batch snapshot
    else if (data.type === 'snapshot' && data.events) {
      console.log('📸 Snapshot received:', data.events.length, 'hazards');
      setHazards(data.events);
    }
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
  }
});
```

---

## 🎯 QUICK TESTING COMMANDS

```bash
# Test upload endpoint
curl -X POST http://localhost:8000/api/predict-video-frame \
  -H "Content-Type: application/json" \
  -d '{"image_base64":"...", "latitude":13.0827, "longitude":80.2707}'

# Test admin solve action
curl -X PATCH http://localhost:8000/api/events/1/solve

# Test admin ignore action
curl -X PATCH http://localhost:8000/api/events/1/ignore

# Get all events
curl http://localhost:8000/api/events | python3 -m json.tool

# Health check
curl http://localhost:8000/api/health | python3 -m json.tool
```
