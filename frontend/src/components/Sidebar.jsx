import { ArrowRight, BarChart3, Home, LogOut, Megaphone, PlusCircle, ReceiptText, ShieldCheck, User } from 'lucide-react';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', Icon: Home },
  { key: 'campaigns', label: 'My Campaigns', Icon: Megaphone },
  { key: 'create-campaign', label: 'Create Campaign', Icon: PlusCircle },
  { key: 'analytics', label: 'Playback Reports', Icon: BarChart3 },
  { key: 'invoices', label: 'Invoices & Payments', Icon: ReceiptText },
  { key: 'verification', label: 'Verification', Icon: ShieldCheck },
  { key: 'profile', label: 'Company Profile', Icon: User },
];

export default function Sidebar({ open, current, onNavigate, onLogout, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-navy-900/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col bg-gradient-to-b from-navy-800 to-navy-900 text-slate-300 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Main navigation">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Megaphone size={24} className="text-sky-400" fill="currentColor" fillOpacity={0.3} />
          </span>
          <div className="leading-tight text-white">
            <p className="text-base font-extrabold">AdTech</p>
            <p className="text-sm font-semibold text-slate-200">Platform</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map(({ key, label, Icon }) => {
            const active = current === key;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${active ? 'bg-gradient-to-r from-brand-600 to-[#7b5cf5] text-white shadow-lg shadow-brand-600/30' : 'hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={19} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4 px-3 pb-4">
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-white/5 hover:text-white">
            <LogOut size={19} />
            Logout
          </button>
          <div className="rounded-2xl bg-gradient-to-br from-[#26307a] to-[#1a2257] p-4 text-center">
            <Megaphone size={34} className="mx-auto mb-2 text-sky-300" fill="currentColor" fillOpacity={0.25} />
            <p className="text-sm font-bold leading-snug text-white">Grow Your Business with Smart Advertising</p>
            <button onClick={() => onNavigate('create-campaign')} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500">
              Create Campaign <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
