import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { analyzeImage } from '../utils/api.js';
import SeverityBadge from '../components/SeverityBadge.jsx';

const hazardTypes = ['Pothole', 'Crack', 'Speedbump', 'Flooding', 'Debris', 'Missing Signage', 'Other'];
const severityLevels = ['Low', 'Medium', 'High'];

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Report() {
  const { user, addReport, apiBase } = useAppContext();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [type, setType] = useState('Pothole');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ city: user?.city || 'Unknown', address: 'Using current location' });
  const [analyzeStatus, setAnalyzeStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation((current) => ({
          ...current,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
      });
    }
  }, []);

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAnalyzeStatus(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setMessage('Analyzing image with AI…');
    try {
      const base64 = await toBase64(image);
      const result = await analyzeImage(apiBase, {
        imageUrl: preview,
        type,
        description,
        location,
      });
      setAnalyzeStatus({
        type: result.detectedType || type,
        confidence: result.confidence || 0.82,
        severity: result.suggestedSeverity || severity,
        annotation: result.annotation || preview,
      });
      setSeverity(result.suggestedSeverity || severity);
      setType(result.detectedType || type);
      setMessage('AI has suggested the best settings for this hazard.');
    } catch (error) {
      setMessage('AI analysis failed. Try again or proceed manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!image) {
      setMessage('Please upload or capture an image.');
      return;
    }
    setLoading(true);
    const report = {
      type,
      severity,
      description,
      location,
      image: preview,
      reporter: user?.fullName || 'You',
      status: 'Pending',
      votes: 1,
      confidence: analyzeStatus?.confidence || 0.74,
    };
    addReport(report);
    setMessage('Report submitted and shared with the community.');
    setLoading(false);
    setImage(null);
    setPreview('');
    setDescription('');
    setAnalyzeStatus(null);
  };

  const locationLabel = useMemo(() => {
    if (location.address && location.city) return `${location.address}, ${location.city}`;
    return 'Location unavailable';
  }, [location]);

  return (
    <main style={{ padding: 20, background: '#021c1a' }}>
      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, color: '#7dd3c7', margin: 0 }}>Report Hazard</p>
            <h2 style={{ fontSize: 18, color: '#e6fffa', margin: 0 }}>Help protect the next driver</h2>
          </div>
        </div>

        <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
          {preview ? (
            <img style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16 }} src={preview} alt="Upload preview" />
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>📸</span>
              <p style={{ color: '#7dd3c7' }}>Take a photo or upload from gallery to analyze the hazard.</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <label style={{ flex: 1, padding: 12, background: '#00c9a7', color: '#021c1a', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontWeight: 600 }}>
              Take Photo
              <input type="file" accept="image/*" capture="environment" onChange={handleImage} hidden />
            </label>
            <label style={{ flex: 1, padding: 12, background: '#00b89a', color: '#021c1a', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontWeight: 600 }}>
              Upload from Gallery
              <input type="file" accept="image/*" onChange={handleImage} hidden />
            </label>
          </div>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#e6fffa', fontWeight: 600 }}>Hazard Type</label>
            <select style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e6fffa' }} value={type} onChange={(e) => setType(e.target.value)}>
              {hazardTypes.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#e6fffa', fontWeight: 600 }}>Severity</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {severityLevels.map((level) => (
                <label key={level} style={{ padding: '8px 16px', borderRadius: 20, background: severity === level ? '#00c9a7' : 'rgba(0,201,167,0.06)', color: severity === level ? '#021c1a' : '#7dd3c7', cursor: 'pointer', border: '1px solid rgba(0,201,167,0.15)' }}>
                  <input type="radio" name="severity" value={level} checked={severity === level} onChange={() => setSeverity(level)} hidden />
                  {level}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#e6fffa', fontWeight: 600 }}>Description</label>
            <textarea style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e6fffa', minHeight: 80 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more context for the community." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#e6fffa', fontWeight: 600 }}>Location</label>
            <input style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(0,201,167,0.15)', background: 'rgba(0,201,167,0.06)', color: '#e6fffa' }} value={locationLabel} readOnly />
          </div>
          <button type="button" style={{ padding: 12, background: '#00c9a7', color: '#021c1a', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={handleAnalyze} disabled={!preview || loading}>
            {loading ? 'Analyzing…' : '🤖 Analyze with AI'}}
          </button>

          {analyzeStatus && (
            <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
              <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>AI Analysis</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#7EB8A8', margin: 0 }}>Detected</p>
                  <strong style={{ fontSize: 16, color: '#E8FFF8' }}>{analyzeStatus.type}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#7EB8A8', margin: 0 }}>Confidence</p>
                  <strong style={{ fontSize: 16, color: '#E8FFF8' }}>{Math.round(analyzeStatus.confidence * 100)}%</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#7EB8A8', margin: 0 }}>Suggested Severity</p>
                  <strong style={{ fontSize: 16, color: '#E8FFF8' }}>{analyzeStatus.severity}</strong>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="submit" style={{ padding: 16, background: '#00C9A7', color: '#060D0D', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 16 }} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
            {message && <p style={{ textAlign: 'center', color: '#00C9A7', fontSize: 14 }}>{message}</p>}
          </div>
        </form>
      </div>
    </main>
  );
}
