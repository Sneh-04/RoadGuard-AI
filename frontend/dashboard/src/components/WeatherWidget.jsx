export default function WeatherWidget({ weather }) {
  return (
    <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:20, padding:18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: 0 }}>Road Condition</p>
          <h2 style={{ fontSize: 18, color: '#e0e7ff', margin: 0 }}>{weather?.summary || 'Clear Roads ✅'}</h2>
        </div>
        <div style={{ fontSize: 40 }}>{weather?.icon || '☀️'}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#2563eb' }}>{Math.round(weather?.temperature || 26)}°</div>
        <div>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: '4px 0' }}>{weather?.current || 'Sunny'}</p>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: '4px 0' }}>Humidity {weather?.humidity || 52}%</p>
          <p style={{ fontSize: 14, color: '#60a5fa', margin: '4px 0' }}>Wind {weather?.windSpeed || 10} km/h</p>
        </div>
      </div>
    </div>
  );
}
