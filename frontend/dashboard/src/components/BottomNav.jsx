const TABS = [
  { id: 'home',     icon: '🏠', label: 'Home'     },
  { id: 'report',   icon: '⚠️',  label: 'Report'   },
  { id: 'navigate', icon: '🗺️',  label: 'Navigate' },
  { id: 'sensor',   icon: '📡',  label: 'Activity'   },
  { id: 'profile',  icon: '👤', label: 'Profile'  },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '72px',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      background: 'rgba(6,13,13,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(37,99,235,0.12)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000
    }}>
      {TABS.map(tab => (
        <button key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flex: 1, height: '100%', gap: '3px',
            border: 'none', background: 'none',
            cursor: 'pointer', padding: '8px 0',
            WebkitTapHighlightColor: 'transparent'
          }}>
          <span style={{
            fontSize: '26px',  /* BIG icons */
            lineHeight: 1,
            filter: active === tab.id
              ? 'drop-shadow(0 0 8px #2563eb)' : 'none',
            transform: active === tab.id
              ? 'scale(1.2)' : 'scale(1)',
            transition: 'all 0.2s ease'
          }}>
            {tab.icon}
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 600,
            color: active === tab.id ? '#2563eb' : '#60a5fa',
            transition: 'color 0.2s ease'
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
