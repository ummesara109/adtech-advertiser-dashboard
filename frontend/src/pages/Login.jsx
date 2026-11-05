import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { api, setToken } from '../api.js';

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const register = mode === 'register';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const switchMode = () => {
    setMode(register ? 'login' : 'register');
    setForm({ name: '', company: '', email: '', password: '', confirm: '' });
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (register && form.password !== form.confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      const body = register ? { name: form.name, company: form.company, email: form.email, password: form.password } : { email: form.email, password: form.password };
      const { token } = await api(register ? '/auth/register' : '/auth/login', { method: 'POST', body });
      setToken(token);
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 to-[#2b2f8f] p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800">
            <Megaphone size={24} className="text-sky-400" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold leading-tight">AdTech Platform</h1>
            <p className="text-sm text-slate-500">{register ? 'Create your advertiser account' : 'Log in to your advertiser dashboard'}</p>
          </div>
        </div>
        <div className="space-y-4">
          {register && (
            <>
              <div>
                <label className="label" htmlFor="name">
                  Contact person
                </label>
                <input id="name" required className="input" value={form.name} onChange={set('name')} autoComplete="off" maxLength={80} />
              </div>
              <div>
                <label className="label" htmlFor="company">
                  Company name
                </label>
                <input id="company" required className="input" value={form.company} onChange={set('company')} autoComplete="off" maxLength={80} />
              </div>
            </>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" required className="input" value={form.email} onChange={set('email')} autoComplete="off" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input id="password" type="password" required minLength={register ? 8 : undefined} className="input" value={form.password} onChange={set('password')} autoComplete="off" />
            {register && <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>}
          </div>
          {register && (
            <div>
              <label className="label" htmlFor="confirm">
                Confirm password
              </label>
              <input id="confirm" type="password" required className="input" value={form.confirm} onChange={set('confirm')} autoComplete="off" />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? (register ? 'Creating account...' : 'Logging in...') : register ? 'Create account' : 'Log in'}
          </button>
          <p className="text-center text-sm text-slate-600">
            {register ? 'Already have an account?' : 'New advertiser?'}{' '}
            <button type="button" onClick={switchMode} className="font-semibold text-brand-600 hover:underline">
              {register ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
