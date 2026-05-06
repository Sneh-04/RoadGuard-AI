const ToggleSwitch = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-white">{label}</span>
      <div
        className={`relative inline-block w-10 h-6 rounded-full transition-colors duration-300 ${
          checked ? 'bg-primary' : 'bg-white/20'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  );
};

export default ToggleSwitch;