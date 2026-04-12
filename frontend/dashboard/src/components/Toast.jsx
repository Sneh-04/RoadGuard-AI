export default function Toast({ message, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 20, left: 20, right: 20, zIndex: 2000, background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#E8FFF8' }}>{message}</span>
        <button type="button" style={{ background: 'none', border: 'none', color: '#E8FFF8', fontSize: 20, cursor: 'pointer' }} onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
