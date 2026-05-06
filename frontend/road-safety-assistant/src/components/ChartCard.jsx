import Card from './Card';

const ChartCard = ({ title, subtitle, children, className = '' }) => {
  return (
    <Card className={`space-y-4 ${className}`}>
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-primary">{title}</div>
        {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="w-full">{children}</div>
    </Card>
  );
};

export default ChartCard;
