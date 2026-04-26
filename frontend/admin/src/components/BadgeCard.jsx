import { Lock, Medal, ShieldCheck, Sparkles, Star } from 'lucide-react';

const badgeIcons = {
  'First Report': Medal,
  'Road Warrior': ShieldCheck,
  'Community Helper': Sparkles,
  'Top Reporter': Star,
};

export default function BadgeCard({ title, description, unlocked = false }) {
  const Icon = badgeIcons[title] || Medal;
  return (
    <div className={`group rounded-[2rem] border border-white/10 p-5 transition duration-300 ${unlocked ? 'bg-white/5 hover:bg-white/10 shadow-[0_20px_50px_rgba(37,99,235,0.12)]' : 'bg-white/5/40 opacity-75'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${unlocked ? 'bg-blue-500/15 text-blue-200' : 'bg-slate-700/70 text-slate-400'}`}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className={`font-semibold ${unlocked ? 'text-slate-100' : 'text-slate-300'}`}>{title}</p>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>
        </div>
        {!unlocked && <Lock className="h-5 w-5 text-slate-400" />}
      </div>
    </div>
  );
}
