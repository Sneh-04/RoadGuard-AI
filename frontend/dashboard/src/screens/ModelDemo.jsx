import { useEffect, useState } from 'react';
import { useSensorSimulation } from '../hooks/useSensorSimulation.js';

export default function ModelDemo() {
  const { sensorData, isActive } = useSensorSimulation();
  const [predictions, setPredictions] = useState(null);
  const [history, setHistory] = useState([]);
  const [avgConfidence, setAvgConfidence] = useState(0);

  // Simulate model inference
  useEffect(() => {
    if (!sensorData) return;

    // Stage 1: Binary Classification (Hazard or Not)
    const vibrationScore = sensorData.vibration || 0;
    const hasHazard = vibrationScore > 0.65;

    // Stage 2: Hazard Type Classification (if hazard detected)
    let hazardType = 'Normal Road';
    let confidence = 1 - vibrationScore;

    if (hasHazard) {
      // Simple heuristic for demo
      if (vibrationScore > 0.85) {
        hazardType = 'Pothole';
        confidence = 0.92;
      } else if (vibrationScore > 0.75) {
        hazardType = 'Speed Bump';
        confidence = 0.87;
      } else {
        hazardType = 'Crack/Debris';
        confidence = 0.78;
      }
    }

    // Fusion: Combine sensor + vision scores
    const sensorScore = vibrationScore;
    const visionScore = (sensorData.cameraConfidence || 0) / 100;
    const fusedConfidence = 0.6 * sensorScore + 0.4 * visionScore;

    const prediction = {
      timestamp: new Date().toLocaleTimeString(),
      stage1: {
        label: hasHazard ? 'HAZARD' : 'NORMAL',
        confidence: (hasHazard ? vibrationScore : confidence).toFixed(3),
      },
      stage2: {
        label: hazardType,
        confidence: confidence.toFixed(3),
      },
      fusion: {
        confidence: fusedConfidence.toFixed(3),
        final: hazardType,
      },
      sensorInput: {
        vibration: (sensorData.vibration || 0).toFixed(3),
        accelerationX: (sensorData.accelerationX || 0).toFixed(2),
        accelerationY: (sensorData.accelerationY || 0).toFixed(2),
        accelerationZ: (sensorData.accelerationZ || 0).toFixed(2),
        gps: sensorData.latitude && sensorData.longitude ? 
          `${sensorData.latitude.toFixed(4)}, ${sensorData.longitude.toFixed(4)}` : 'N/A',
      },
    };

    setPredictions(prediction);

    // Keep history of last 10 predictions
    setHistory((prev) => {
      const updated = [prediction, ...prev].slice(0, 10);
      const avgConf = (
        updated.reduce((sum, p) => sum + parseFloat(p.fusion.confidence), 0) /
        updated.length
      ).toFixed(3);
      setAvgConfidence(avgConf);
      return updated;
    });
  }, [sensorData]);

  return (
    <main style={{ padding: 20, background: '#021c1a', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 32, color: '#e6fffa', margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 10 }}>
          ⚡ Real-Time Model Inference Demo
        </h1>
        <p style={{ color: '#7dd3c7', marginTop: 8 }}>
          Live sensor data → Stage1 CNN → Stage2 CNN → Fusion Algorithm
        </p>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isActive ? '#00c9a7' : '#4b5563',
            boxShadow: isActive ? '0 0 10px #00c9a7' : 'none',
            animation: isActive ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ color: '#7dd3c7' }}>
            {isActive ? '● Live Sensor: ACTIVE' : '○ Live Sensor: INACTIVE'}
          </span>
        </div>
      </div>

      {/* Real-Time Sensor Input */}
      <div style={{
        background: 'rgba(0,201,167,0.06)',
        border: '1px solid rgba(0,201,167,0.15)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 18, color: '#e6fffa', margin: '0 0 16 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚡ Sensor Input (Real-Time)
        </h2>
        {sensorData ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(0,201,167,0.1)', padding: 12, borderRadius: 8, borderLeft: '3px solid #00c9a7' }}>
              <p style={{ color: '#7dd3c7', margin: '0 0 4 0', fontSize: 12 }}>Vibration</p>
              <p style={{ color: '#00c9a7', margin: 0, fontSize: 20, fontWeight: 'bold' }}>
                {(sensorData.vibration || 0).toFixed(3)}
              </p>
            </div>
            <div style={{ background: 'rgba(0,201,167,0.1)', padding: 12, borderRadius: 8, borderLeft: '3px solid #00c9a7' }}>
              <p style={{ color: '#7dd3c7', margin: '0 0 4 0', fontSize: 12 }}>Accel X</p>
              <p style={{ color: '#00c9a7', margin: 0, fontSize: 20, fontWeight: 'bold' }}>
                {(sensorData.accelerationX || 0).toFixed(2)}
              </p>
            </div>
            <div style={{ background: 'rgba(0,201,167,0.1)', padding: 12, borderRadius: 8, borderLeft: '3px solid #00c9a7' }}>
              <p style={{ color: '#7dd3c7', margin: '0 0 4 0', fontSize: 12 }}>Accel Y</p>
              <p style={{ color: '#00c9a7', margin: 0, fontSize: 20, fontWeight: 'bold' }}>
                {(sensorData.accelerationY || 0).toFixed(2)}
              </p>
            </div>
            <div style={{ background: 'rgba(0,201,167,0.1)', padding: 12, borderRadius: 8, borderLeft: '3px solid #00c9a7' }}>
              <p style={{ color: '#7dd3c7', margin: '0 0 4 0', fontSize: 12 }}>Accel Z</p>
              <p style={{ color: '#00c9a7', margin: 0, fontSize: 20, fontWeight: 'bold' }}>
                {(sensorData.accelerationZ || 0).toFixed(2)}
              </p>
            </div>
            <div style={{ background: 'rgba(0,201,167,0.1)', padding: 12, borderRadius: 8, borderLeft: '3px solid #00c9a7' }}>
              <p style={{ color: '#7dd3c7', margin: '0 0 4 0', fontSize: 12 }}>Camera Confidence</p>
              <p style={{ color: '#00c9a7', margin: 0, fontSize: 20, fontWeight: 'bold' }}>
                {sensorData.cameraConfidence || 0}%
              </p>
            </div>
            <div style={{ background: 'rgba(0,201,167,0.1)', padding: 12, borderRadius: 8, borderLeft: '3px solid #00c9a7' }}>
              <p style={{ color: '#7dd3c7', margin: '0 0 4 0', fontSize: 12 }}>GPS Location</p>
              <p style={{ color: '#00c9a7', margin: 0, fontSize: 12, fontWeight: 'bold' }}>
                {sensorData.latitude ? `${sensorData.latitude.toFixed(4)}, ${sensorData.longitude.toFixed(4)}` : 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#7dd3c7' }}>Waiting for sensor data...</p>
        )}
      </div>

      {/* Inference Pipeline */}
      {predictions && (
        <>
          {/* Stage 1: Binary Classification */}
          <div style={{
            background: 'rgba(59,82,217,0.06)',
            border: '2px solid #3b52d9',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 16, color: '#60a5fa', margin: '0 0 16 0', fontWeight: 'bold' }}>
              Stage 1: Binary Classification CNN
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ color: '#7dd3c7', fontSize: 12, margin: 0 }}>Prediction</p>
                <p style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  margin: '8px 0 0 0',
                  color: predictions.stage1.label === 'HAZARD' ? '#ef4444' : '#10b981',
                }}>
                  {predictions.stage1.label}
                </p>
              </div>
              <div>
                <p style={{ color: '#7dd3c7', fontSize: 12, margin: 0 }}>Confidence</p>
                <div style={{ marginTop: 8 }}>
                  <p style={{ color: '#60a5fa', fontSize: 20, fontWeight: 'bold', margin: 0 }}>
                    {(parseFloat(predictions.stage1.confidence) * 100).toFixed(1)}%
                  </p>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(59,82,217,0.2)',
                    borderRadius: 4,
                    marginTop: 8,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${parseFloat(predictions.stage1.confidence) * 100}%`,
                      height: '100%',
                      background: '#3b52d9',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 2: Hazard Type Classification */}
          <div style={{
            background: 'rgba(217,119,6,0.06)',
            border: '2px solid #d97706',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 16, color: '#fbbf24', margin: '0 0 16 0', fontWeight: 'bold' }}>
              Stage 2: Hazard Type Classification CNN
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ color: '#7dd3c7', fontSize: 12, margin: 0 }}>Predicted Type</p>
                <p style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  margin: '8px 0 0 0',
                  color: '#fbbf24',
                }}>
                  {predictions.stage2.label}
                </p>
              </div>
              <div>
                <p style={{ color: '#7dd3c7', fontSize: 12, margin: 0 }}>Confidence</p>
                <div style={{ marginTop: 8 }}>
                  <p style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold', margin: 0 }}>
                    {(parseFloat(predictions.stage2.confidence) * 100).toFixed(1)}%
                  </p>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(217,119,6,0.2)',
                    borderRadius: 4,
                    marginTop: 8,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${parseFloat(predictions.stage2.confidence) * 100}%`,
                      height: '100%',
                      background: '#d97706',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fusion Algorithm Result */}
          <div style={{
            background: 'rgba(16,185,129,0.06)',
            border: '2px solid #10b981',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 16, color: '#6ee7b7', margin: '0 0 16 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
              👁️ Fusion Algorithm (60% Sensor + 40% Vision)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ color: '#7dd3c7', fontSize: 12, margin: 0 }}>Final Prediction</p>
                <p style={{
                  fontSize: 26,
                  fontWeight: 'bold',
                  margin: '8px 0 0 0',
                  color: '#10b981',
                }}>
                  {predictions.fusion.final}
                </p>
              </div>
              <div>
                <p style={{ color: '#7dd3c7', fontSize: 12, margin: 0 }}>Fused Confidence</p>
                <div style={{ marginTop: 8 }}>
                  <p style={{ color: '#10b981', fontSize: 20, fontWeight: 'bold', margin: 0 }}>
                    {(parseFloat(predictions.fusion.confidence) * 100).toFixed(1)}%
                  </p>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(16,185,129,0.2)',
                    borderRadius: 4,
                    marginTop: 8,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${parseFloat(predictions.fusion.confidence) * 100}%`,
                      height: '100%',
                      background: '#10b981',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prediction History */}
          <div style={{
            background: 'rgba(0,201,167,0.06)',
            border: '1px solid rgba(0,201,167,0.15)',
            borderRadius: 16,
            padding: 20,
          }}>
            <h3 style={{ fontSize: 16, color: '#e6fffa', margin: '0 0 4 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
              📈 Prediction History (Last 10)
            </h3>
            <p style={{ color: '#7dd3c7', margin: '4 0 16 0', fontSize: 12 }}>
              Average Confidence: <span style={{ color: '#00c9a7', fontWeight: 'bold' }}>{avgConfidence}</span>
            </p>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((pred, idx) => (
                <div key={idx} style={{
                  background: 'rgba(0,201,167,0.1)',
                  padding: 12,
                  borderRadius: 8,
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 100px 100px',
                  gap: 12,
                  alignItems: 'center',
                  fontSize: 12,
                }}>
                  <span style={{ color: '#7dd3c7' }}>{pred.timestamp}</span>
                  <span style={{ color: '#00c9a7', fontWeight: 'bold' }}>{pred.stage2.label}</span>
                  <span style={{ color: '#7dd3c7' }}>
                    Conf: {(parseFloat(pred.stage2.confidence) * 100).toFixed(0)}%
                  </span>
                  <span style={{
                    color: parseFloat(pred.stage1.confidence) > 0.65 ? '#ef4444' : '#10b981',
                    fontWeight: 'bold',
                  }}>
                    {pred.stage1.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 201, 167, 0.06);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 201, 167, 0.3);
          border-radius: 3px;
        }
      `}</style>
    </main>
  );
}
