export default function Toast({ message, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 20, left: 20, right: 20, zIndex: 2000, background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:20, padding:18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#e0e7ff' }}>{message}</span>
        <button type="button" style={{ background: 'none', border: 'none', color: '#e0e7ff', fontSize: 20, cursor: 'pointer' }} onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
