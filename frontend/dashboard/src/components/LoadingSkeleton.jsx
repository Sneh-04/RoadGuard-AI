export default function LoadingSkeleton({ lines = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} style={{ height: 16, background: 'rgba(37,99,235,0.1)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  );
}
