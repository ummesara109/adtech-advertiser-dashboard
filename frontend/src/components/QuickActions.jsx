import { BarChart3, Megaphone, ReceiptText, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../context.js';

export default function QuickActions() {
  const { navigate } = useApp();
  const tiles = [
    { label: 'Create Campaign', Icon: Megaphone, bg: 'bg-brand-100', fg: 'text-brand-600', go: 'create-campaign' },
    { label: 'Playback Reports', Icon: BarChart3, bg: 'bg-emerald-50', fg: 'text-emerald-600', go: 'analytics' },
    { label: 'Invoices & Payments', Icon: ReceiptText, bg: 'bg-amber-50', fg: 'text-amber-500', go: 'invoices' },
    { label: 'Verification', Icon: ShieldCheck, bg: 'bg-sky-50', fg: 'text-sky-600', go: 'verification' },
  ];
  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Zap size={20} className="text-brand-600" />Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(({ label, Icon, bg, fg, go }) => (
          <button key={label} onClick={() => navigate(go)} className={`flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs font-semibold text-slate-700 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${bg}`}>
            <Icon size={24} className={fg} />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
