import { useEffect, useState } from 'react';

function RoadGuardLogo({ size = 80 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.28,
      background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 32px rgba(37,99,235,0.35)',
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

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setVisible(true), 100);
    // Auto advance after 2.5 seconds
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: '#060D0D',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '20px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease'
    }}>
      <RoadGuardLogo size={90} />
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '34px', fontWeight: '800',
          color: '#e0e7ff', letterSpacing: '-1px',
          margin: 0
        }}>RoadGuard</h1>
        <p style={{
          fontSize: '14px', color: '#60a5fa',
          marginTop: '8px'
        }}>Intelligent Road Safety Platform</p>
      </div>
      {/* Loading dots */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: '8px', height: '8px',
            borderRadius: '50%',
            background: '#2563eb',
            animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite`
          }}/>
        ))}
      </div>
    </div>
  );
}
