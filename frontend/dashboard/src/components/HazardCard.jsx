import SeverityBadge from './SeverityBadge.jsx';
import { timeAgo } from '../utils/helpers.js';

export default function HazardCard({ hazard, onAction }) {
  return (
    <article style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, marginBottom: 16, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 120, backgroundImage: `url(${hazard.image})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px 16px 0 0' }} />
      <div style={{ padding: 16, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#E8FFF8', margin: 0 }}>{hazard.type}</p>
            <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>{hazard.location.address}</p>
          </div>
          <SeverityBadge value={hazard.severity} />
        </div>
        <p style={{ fontSize: 12, color: '#7EB8A8', margin: '8px 0' }}>{hazard.distance.toFixed(1)} km away • {timeAgo(hazard.timestamp)}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: '#7EB8A8' }}>{hazard.reporter}</span>
          <button type="button" onClick={() => onAction?.(hazard.id)} style={{ background: '#00C9A7', color: '#060D0D', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            {hazard.status === 'Resolved' ? 'Resolved' : 'View'}
          </button>
        </div>
      </div>
    </article>
  );
}
