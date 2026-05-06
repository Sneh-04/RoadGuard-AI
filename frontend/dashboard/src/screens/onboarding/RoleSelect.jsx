function RoadGuardLogo({ size = 56 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.28,
      background: 'linear-gradient(135deg, #00C9A7, #00E5CC)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 32px rgba(0,201,167,0.35)',
      flexShrink: 0
    }}>
      <svg width={size*0.6} height={size*0.6}
        viewBox="0 0 32 32" fill="none">
        {/* Road shield icon */}
        <path d="M16 2L4 8v10c0 7 5.5 11.5 12 14
                 6.5-2.5 12-7 12-14V8L16 2z"
          fill="rgba(0,0,0,0.25)" stroke="white"
          strokeWidth="1.5"/>
        {/* Road lines */}
        <rect x="15" y="8" width="2" height="4"
          rx="1" fill="white"/>
        <rect x="15" y="14" width="2" height="4"
          rx="1" fill="white"/>
        {/* Wheel/hazard symbol */}
        <circle cx="16" cy="22" r="3"
          fill="none" stroke="white" strokeWidth="1.5"/>
        <path d="M13 19l6 6M19 19l-6 6"
          stroke="white" strokeWidth="1.2"/>
      </svg>
    </div>
  );
}

export default function RoleSelect({ onSelect }) {
  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: '#060D0D',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', gap: '32px'
    }}>
      {/* Logo + title */}
      <div style={{ textAlign: 'center' }}>
        <RoadGuardLogo size={70} />
        <h1 style={{ fontSize: '28px', fontWeight: '800',
          color: '#E8FFF8', marginTop: '16px' }}>
          RoadGuard
        </h1>
        <p style={{ color: '#7EB8A8', fontSize: '14px',
          marginTop: '6px' }}>
          Choose how you want to continue
        </p>
      </div>

      {/* Role cards */}
      <div style={{ display: 'flex', flexDirection: 'column',
        gap: '16px', width: '100%', maxWidth: '360px' }}>

        {/* User card */}
        <button onClick={() => onSelect('user')} style={{
          background: 'rgba(0,201,167,0.06)',
          border: '1.5px solid rgba(0,201,167,0.3)',
          borderRadius: '20px', padding: '24px',
          cursor: 'pointer', textAlign: 'left',
          transition: 'all 0.2s ease',
          width: '100%'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>
            👤
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700',
            color: '#E8FFF8', marginBottom: '6px' }}>
            User
          </div>
          <div style={{ fontSize: '13px', color: '#7EB8A8',
            lineHeight: 1.5 }}>
            Navigate roads, report hazards and stay safe
          </div>
          <div style={{ marginTop: '14px', fontSize: '13px',
            fontWeight: '600', color: '#00C9A7' }}>
            Continue as User →
          </div>
        </button>

        {/* Admin card */}
        <button onClick={() => onSelect('admin')} style={{
          background: 'rgba(155,89,182,0.06)',
          border: '1.5px solid rgba(155,89,182,0.3)',
          borderRadius: '20px', padding: '24px',
          cursor: 'pointer', textAlign: 'left',
          transition: 'all 0.2s ease',
          width: '100%'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>
            🛡️
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700',
            color: '#E8FFF8', marginBottom: '6px' }}>
            Admin
          </div>
          <div style={{ fontSize: '13px', color: '#7EB8A8',
            lineHeight: 1.5 }}>
            Manage reports, users and view full analytics
          </div>
          <div style={{ marginTop: '14px', fontSize: '13px',
            fontWeight: '600', color: '#9B59B6' }}>
            Continue as Admin →
          </div>
        </button>
      </div>
    </div>
  );
}
