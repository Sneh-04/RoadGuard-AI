const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    high: 'bg-red-500/20 text-red-400 border-red-500/50',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    low: 'bg-green-500/20 text-green-400 border-green-500/50',
    default: 'bg-primary/20 text-primary border-primary/50',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;