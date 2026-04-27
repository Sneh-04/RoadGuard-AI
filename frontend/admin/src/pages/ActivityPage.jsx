import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';

const stats = [
  { label: 'Roads Traveled Today', value: '59 km', variant: 'active' },
  { label: 'Hazards Encountered', value: '0', variant: 'low' },
  { label: 'Reports Submitted', value: '0', variant: 'medium' },
  { label: 'Safety Score', value: '84/100', variant: 'high' },
];

const details = [
  { label: 'Community Impact', value: '1240 users helped' },
  { label: 'Trip History', value: '47 km this week' },
  { label: 'Best Route', value: 'Anna Salai' },
  { label: 'Next Trip', value: '5am - 8am' },
];

export default function ActivityPage() {
  return (
    <div className="space-y-6 pb-28">
      <div className="rounded-[2rem] border border-white/10 bg-[#102f2f]/90 p-6 shadow-[0_35px_80px_rgba(20,184,166,0.14)] backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-200/70">Activity Dashboard</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-100">Your performance at a glance</h2>
        <p className="mt-2 text-sm text-slate-400">A quick summary of your road safety activity and community impact.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} title={item.label} className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-4xl font-semibold text-slate-100">{item.value}</p>
              <Badge label={item.label.includes('Safety') ? 'Top' : 'Live'} variant={item.variant} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {details.map((item) => (
          <Card key={item.label} className="p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-100">{item.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
