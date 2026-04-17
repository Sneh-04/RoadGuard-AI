import { useEffect, useRef, useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Activity, Play, Pause, RotateCcw, Smartphone } from 'lucide-react';

const SensorTest = () => {
  const [mode, setMode] = useState('synthetic');
  const [isRunning, setIsRunning] = useState(false);
  const [readings, setReadings] = useState([]);
  const [currentReading, setCurrentReading] = useState({ x: 0, y: 0, z: 9.8 });
  const [detection, setDetection] = useState('Safe road');
  const [status, setStatus] = useState('safe');
  const readingsRef = useRef([]);
  const sensorListenerRef = useRef(null);
  const simulationIntervalRef = useRef(null);

  // Synthetic data generator
  const generateSyntheticData = () => {
    const scenarios = [
      { name: 'smooth', x: () => 0.1, y: () => 0.1, z: () => 9.8 + Math.random() * 0.2 },
      {
        name: 'pothole',
        x: () => 0.5 + Math.random() * 1.2,
        y: () => 0.3 + Math.random() * 0.8,
        z: () => 12 + Math.random() * 4,
      },
      {
        name: 'speedbump',
        x: () => 0.3 + Math.random() * 0.6,
        y: () => 0.2 + Math.random() * 0.4,
        z: () => 11 + Math.random() * 2.5,
      },
    ];

    let currentScenario = 0;
    let readingsInScenario = 0;

    return () => {
      if (readingsInScenario > 30) {
        currentScenario = (currentScenario + 1) % scenarios.length;
        readingsInScenario = 0;
      }
      const scenario = scenarios[currentScenario];
      readingsInScenario++;
      return {
        x: scenario.x(),
        y: scenario.y(),
        z: scenario.z(),
        scenario: scenario.name,
      };
    };
  };

  const detectHazard = (reading) => {
    const magnitude = Math.sqrt(reading.x ** 2 + reading.y ** 2 + (reading.z - 9.8) ** 2);

    if (magnitude > 3.5) {
      return { hazard: 'Pothole detected', status: 'danger' };
    } else if (magnitude > 2.0) {
      return { hazard: 'Speed bump detected', status: 'warning' };
    }
    return { hazard: 'Safe road', status: 'safe' };
  };

  const startSynthetic = () => {
    setReadings([]);
    readingsRef.current = [];
    const generator = generateSyntheticData();
    setIsRunning(true);

    simulationIntervalRef.current = setInterval(() => {
      const reading = generator();
      setCurrentReading(reading);
      const { hazard, status: newStatus } = detectHazard(reading);
      setDetection(hazard);
      setStatus(newStatus);

      readingsRef.current = [...readingsRef.current.slice(-59), reading];
      setReadings([...readingsRef.current]);
    }, 100);
  };

  const startRealSensor = () => {
    setReadings([]);
    readingsRef.current = [];
    setIsRunning(true);

    sensorListenerRef.current = (event) => {
      const acc = event.accelerationIncludingGravity;
      const reading = {
        x: acc.x || 0,
        y: acc.y || 0,
        z: acc.z || 9.8,
      };

      setCurrentReading(reading);
      const { hazard, status: newStatus } = detectHazard(reading);
      setDetection(hazard);
      setStatus(newStatus);

      readingsRef.current = [...readingsRef.current.slice(-59), reading];
      setReadings([...readingsRef.current]);
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', sensorListenerRef.current);
    } else {
      alert('Device motion not supported on this device.')
    }
  };

  const stopSimulation = () => {
    setIsRunning(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    if (sensorListenerRef.current) {
      window.removeEventListener('devicemotion', sensorListenerRef.current);
      sensorListenerRef.current = null;
    }
  };

  const resetData = () => {
    stopSimulation();
    setReadings([]);
    readingsRef.current = [];
    setCurrentReading({ x: 0, y: 0, z: 9.8 });
    setDetection('Safe road');
    setStatus('safe');
  };

  const handleModeChange = (newMode) => {
    stopSimulation();
    setMode(newMode);
  };

  const handleStart = () => {
    if (mode === 'synthetic') {
      startSynthetic();
    } else if (mode === 'real') {
      startRealSensor();
    }
  };

  const statusColors = {
    safe: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', label: 'Safe' },
    warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', label: 'Warning' },
    danger: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', label: 'Danger' },
  };

  const currentStatus = statusColors[status];

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="flex items-center gap-3">
        <Activity className="text-primary" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-white">Sensor Testing</h1>
          <p className="text-white/70 text-sm">Accelerometer-based hazard detection</p>
        </div>
      </div>

      <Card>
        <label className="block text-sm font-medium mb-3">Data Input Mode</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { id: 'synthetic', label: 'Synthetic Data', desc: 'Simulated scenarios' },
            { id: 'real', label: 'Real Sensor', desc: 'Device motion API' },
          ].map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => handleModeChange(id)}
              className={`rounded-3xl border-2 p-4 text-left transition ${
                mode === id
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <div className="font-semibold">{label}</div>
              <div className="text-xs text-white/60">{desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className={`${currentStatus.bg} border ${currentStatus.border}`}>
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStatus.bg} border ${currentStatus.border}`}>
            <span className="text-xl">{status === 'safe' ? '✅' : status === 'warning' ? '⚠️' : '🚨'}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.1em] text-white/70">Status</p>
            <p className={`text-2xl font-bold ${currentStatus.text}`}>{currentStatus.label}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">Detection</p>
            <p className="font-semibold text-white">{detection}</p>
          </div>
        </div>
      </Card>

      <Card>
        <label className="block text-sm font-medium mb-3">Current Reading (m/s²)</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'X-Axis', value: currentReading.x.toFixed(2) },
            { label: 'Y-Axis', value: currentReading.y.toFixed(2) },
            { label: 'Z-Axis', value: currentReading.z.toFixed(2) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-white/5 p-3 text-center">
              <div className="text-xs text-white/70 uppercase">{label}</div>
              <div className="mt-2 text-xl font-bold text-primary">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <label className="block text-sm font-medium mb-3">Z-Axis Variation (last 60 readings)</label>
        <div className="h-32 bg-white/5 rounded-2xl p-2 overflow-hidden">
          <svg viewBox="0 0 600 120" className="w-full h-full" preserveAspectRatio="none">
            {readings.length > 1 && (
              <polyline
                points={readings
                  .map((r, i) => `${(i / readings.length) * 600},${120 - (r.z - 8) * 8}`)
                  .join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              />
            )}
            {readings.map((r, i) => (
              <circle
                key={i}
                cx={(i / readings.length) * 600}
                cy={120 - (r.z - 8) * 8}
                r="2"
                fill="#38bdf8"
              />
            ))}
          </svg>
        </div>
        <p className="text-xs text-white/70 mt-2">Range: 8 - 16 m/s² | Blue line shows Z-axis acceleration over time</p>
      </Card>

      <Card>
        <label className="block text-sm font-medium mb-3">Controls</label>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-black font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Play size={18} />
            Start
          </button>
          <button
            onClick={stopSimulation}
            disabled={!isRunning}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Pause size={18} />
            Stop
          </button>
          <button
            onClick={resetData}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-white font-semibold hover:bg-white/20 transition"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Smartphone size={16} />
          <span>
            {mode === 'real'
              ? 'Move your device to test real accelerometer data'
              : 'Simulating road scenarios: smooth → pothole → speed bump'}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default SensorTest;
