export default function ToggleSwitch({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[1.75rem] bg-white/5 px-4 py-4 transition duration-300 hover:bg-white/10">
      <div>
        <p className="font-medium text-slate-100">{label}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-9 w-16 items-center rounded-full transition duration-300 ${checked ? 'bg-primary' : 'bg-slate-700/80'}`}
        aria-pressed={checked}
      >
        <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition duration-300 ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}
