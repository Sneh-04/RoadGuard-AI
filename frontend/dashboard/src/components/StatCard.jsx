export default function StatCard({ title, value, subtitle, accent }) {
  return (
    <div style={{ background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:20, padding:18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${accent || '#4f8ef7'}` }}>
      <div>
        <p style={{ fontSize: 14, color: '#7EB8A8', margin: 0 }}>{title}</p>
        <h3 style={{ fontSize: 24, fontWeight: 700, color: '#E8FFF8', margin: 0 }}>{value}</h3>
      </div>
      {subtitle && <p style={{ fontSize: 12, color: '#7EB8A8', margin: 0 }}>{subtitle}</p>}
    </div>
  );
}
