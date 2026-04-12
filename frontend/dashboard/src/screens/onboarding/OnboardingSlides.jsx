import { useState } from 'react';

const slides = [
  {
    title: 'Detect Road Hazards',
    body: 'Scan potholes, cracks and unexpected danger with a single tap. RoadGuard keeps your daily ride safe.',
    emoji: '🛣️',
  },
  {
    title: 'Navigate Safely',
    body: 'Follow the smartest route that avoids trouble zones, traffic and dangerous stretches.',
    emoji: '🗺️',
  },
  {
    title: 'Real-Time Insights',
    body: 'Instant community alerts, hazard trends and sensor analysis for smarter journeys.',
    emoji: '📊',
  },
];

export default function OnboardingSlides({ onComplete }) {
  const [index, setIndex] = useState(0);

  return (
    <main style={{ height: '100vh', width: '100vw', background: '#060D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:24, textAlign: 'center', position: 'relative' }}>
        <button type="button" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#7EB8A8', cursor: 'pointer', fontSize: 14 }} onClick={onComplete}>
          Skip
        </button>
        <div style={{ fontSize: 80, marginBottom: 24 }}>{slides[index].emoji}</div>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>{slides[index].emoji}</p>
          <h1 style={{ fontSize: 24, color: '#E8FFF8', margin: '8px 0' }}>{slides[index].title}</h1>
          <p style={{ fontSize: 16, color: '#7EB8A8', lineHeight: 1.5, margin: 0 }}>{slides[index].body}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {slides.map((_, idx) => (
              <button
                type="button"
                key={idx}
                style={{ width: 8, height: 8, borderRadius: 4, background: idx === index ? '#00C9A7' : '#7EB8A8', border: 'none', cursor: 'pointer' }}
                onClick={() => setIndex(idx)}
              />
            ))}
          </div>
          <div>
            {index < slides.length - 1 ? (
              <button type="button" style={{ padding: '12px 24px', background: '#7EB8A8', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={() => setIndex(index + 1)}>
                Next
              </button>
            ) : (
              <button type="button" style={{ padding: '12px 24px', background: '#00C9A7', color: '#060D0D', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={onComplete}>
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
