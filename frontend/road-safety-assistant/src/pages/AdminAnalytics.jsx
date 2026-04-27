import Card from '../components/Card';
import ChartCard from '../components/ChartCard';

const AdminAnalytics = () => {
  return (
    <div className="space-y-4 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Full Analytics</h2>
        <p className="text-white/70">Detailed insight across hazard reporting and community trends.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Reports by hour" subtitle="Peak traffic alerts" className="">
          <div className="grid grid-cols-4 gap-2 text-white/80 text-xs">
            {['6am', '9am', '12pm', '3pm'].map((label) => (
              <div key={label} className="space-y-2">
                <div className="h-28 w-full rounded-3xl bg-white/10 flex items-end justify-center">
                  <div className={`w-full rounded-t-3xl ${label === '9am' ? 'bg-primary/90 h-20' : label === '12pm' ? 'bg-emerald-400/80 h-14' : label === '3pm' ? 'bg-orange-400/80 h-10' : 'bg-sky-400/80 h-16'}`} />
                </div>
                <div className="text-center">{label}</div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Severity mix" subtitle="Current distribution" className="">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-center p-4 bg-white/5 rounded-3xl">
              <div className="h-32 w-32 rounded-full bg-gradient-to-r from-primary via-teal-400 to-teal-300" />
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-center justify-between">
                <span>High</span>
                <span>34%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Medium</span>
                <span>42%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Low</span>
                <span>24%</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      <Card>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Top hazard zones</p>
            <ul className="mt-4 space-y-3 text-white/80 text-sm">
              <li>Anna Salai — 17 alerts</li>
              <li>Adyar — 13 alerts</li>
              <li>T. Nagar — 11 alerts</li>
              <li>Guindy — 9 alerts</li>
            </ul>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Alert trends</p>
            <p className="mt-3 text-white/70">High severity reports are up 18% compared to last week, with potholes leading the total alerts.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
