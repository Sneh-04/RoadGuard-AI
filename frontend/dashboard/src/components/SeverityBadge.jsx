const severityStyles = {
  Low: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' },
  Medium: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' },
  High: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 8px', borderRadius: 12, fontWeight: 600, textTransform: 'uppercase' },
};

export default function SeverityBadge({ value }) {
  const style = severityStyles[value] || severityStyles.Low;
  return (
    <span style={style}>
      {value}
    </span>
  );
}
