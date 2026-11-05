import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken } from './api.js';
import { AppContext } from './context.js';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Analytics from './pages/Analytics.jsx';
import Campaigns from './pages/Campaigns.jsx';
import CreateCampaign from './pages/CreateCampaign.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Invoices from './pages/Invoices.jsx';
import Profile from './pages/Profile.jsx';
import Verification from './pages/Verification.jsx';

const PAGES = {
  dashboard: Dashboard,
  campaigns: Campaigns,
  'create-campaign': CreateCampaign,
  analytics: Analytics,
  invoices: Invoices,
  verification: Verification,
  profile: Profile,
};

const readRoute = () => {
  const key = window.location.hash.replace(/^#\/?/, '');
  return PAGES[key] ? key : 'dashboard';
};

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [route, setRoute] = useState(readRoute());
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onLogout = () => setAuthed(false);
    window.addEventListener('adtech:logout', onLogout);
    return () => window.removeEventListener('adtech:logout', onLogout);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await api('/profile'));
    } catch {
      /* a 401 is handled by the api helper */
    }
  }, []);

  useEffect(() => {
    if (authed) refreshUser();
  }, [authed, refreshUser]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const navigate = useCallback((key) => {
    window.location.hash = `#/${key}`;
    if (window.innerWidth < 1024) setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore - token is cleared either way */
    }
    clearToken();
    setUser(null);
    setAuthed(false);
  }, []);

  const ctx = useMemo(
    () => ({ navigate, logout, refreshUser, notify: (message, type = 'success') => setToast({ message, type }) }),
    [navigate, logout, refreshUser]
  );

  if (!authed) return <Login onLoggedIn={() => setAuthed(true)} />;

  const Page = PAGES[route];

  return (
    <AppContext.Provider value={ctx}>
      <Sidebar open={sidebarOpen} current={route} onNavigate={navigate} onLogout={logout} onClose={() => setSidebarOpen(false)} />
      <div className={`min-h-screen transition-[padding] duration-200 ${sidebarOpen ? 'lg:pl-[220px]' : ''}`}>
        <Header user={user} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="px-4 pb-10 sm:px-6">
          <Page key={route} />
        </main>
      </div>

      {toast && (
        <div role="status" className={`fixed bottom-5 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${toast.type === 'error' ? 'bg-red-600' : 'bg-navy-800'}`}>
          {toast.message}
        </div>
      )}
    </AppContext.Provider>
  );
}
