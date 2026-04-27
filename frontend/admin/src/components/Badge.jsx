const variants = {
  low: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20',
  medium: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20',
  high: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20',
  active: 'bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/20',
};

export default function Badge({ label, variant = 'active', className = '' }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${variants[variant] || variants.active} ${className}`}>
      {label}
    </span>
  );
}
