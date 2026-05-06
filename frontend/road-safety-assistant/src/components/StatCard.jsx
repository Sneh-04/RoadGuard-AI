import Card from './Card';

const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <Card className="text-center">
      {Icon && <Icon className="mx-auto mb-2 text-primary" size={32} />}
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/70">{title}</div>
    </Card>
  );
};

export default StatCard;