import { useRef, useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';
import { useApp } from '../context.js';
import useClickOutside from './useClickOutside.js';

function ProfileMenu({ user }) {
  const { navigate, logout } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  const go = (page) => { setOpen(false); navigate(page); };
  const item = 'block w-full px-4 py-2 text-left text-sm hover:bg-slate-50';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{(user?.name || '?').charAt(0).toUpperCase()}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-bold">{user?.name}</span>
          <span className="block text-xs text-slate-500">{user?.company || user?.role}</span>
        </span>
        <ChevronDown size={16} className="text-slate-500" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          <button role="menuitem" onClick={() => go('profile')} className={item}>Company profile</button>
          <button role="menuitem" onClick={() => go('verification')} className={item}>Verification</button>
          <button role="menuitem" onClick={logout} className={`${item} text-red-600`}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default function Header({ user, onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <button onClick={onToggleSidebar} aria-label="Toggle sidebar" className="rounded-lg p-2 text-slate-700 hover:bg-white">
        <Menu size={22} />
      </button>
      <ProfileMenu user={user} />
    </header>
  );
}
