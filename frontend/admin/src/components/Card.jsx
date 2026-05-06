export default function Card({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-[2rem] border border-white/10 bg-[#0f2f2f]/80 p-5 shadow-[0_25px_80px_rgba(20,184,166,0.16)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_35px_90px_rgba(20,184,166,0.18)] ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4 flex flex-col gap-1">
          {title && <h2 className="text-xl font-semibold tracking-tight text-slate-100">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
