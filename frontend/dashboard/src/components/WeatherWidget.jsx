export default function WeatherWidget({ weather }) {
  return (
    <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>Road Condition</p>
          <h2 style={{ fontSize: 18, color: '#E8FFF8', margin: 0 }}>{weather?.summary || 'Clear Roads ✅'}</h2>
        </div>
        <div style={{ fontSize: 40 }}>{weather?.icon || '☀️'}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#00C9A7' }}>{Math.round(weather?.temperature || 26)}°</div>
        <div>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: '4px 0' }}>{weather?.current || 'Sunny'}</p>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: '4px 0' }}>Humidity {weather?.humidity || 52}%</p>
          <p style={{ fontSize: 14, color: '#7EB8A8', margin: '4px 0' }}>Wind {weather?.windSpeed || 10} km/h</p>
        </div>
      </div>
    </div>
  );
}
