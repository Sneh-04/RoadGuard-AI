export default function StatCard({ label, value, className = '' }) {
  return (
    <div className={`rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(20,184,166,0.12)] transition duration-300 hover:-translate-y-1 hover:bg-white/10 ${className}`}>
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
