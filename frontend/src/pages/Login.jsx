import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { api, setToken, clearToken } from '../api.js';

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
    confirm: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const register = mode === 'register';

  const set = (key) => (e) => {
    setForm((previous) => ({
      ...previous,
      [key]: e.target.value
    }));
  };

  const switchMode = () => {
    setMode(register ? 'login' : 'register');

    setForm({
      name: '',
      company: '',
      email: '',
      password: '',
      confirm: ''
    });

    setError('');
    setSuccess('');
  };

  const submit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (register && form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const body = register
        ? {
            name: form.name.trim(),
            company: form.company.trim(),
            email: form.email.trim(),
            password: form.password
          }
        : {
            email: form.email.trim(),
            password: form.password
          };

      const data = await api(
        register ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          body
        }
      );

      // REGISTRATION SUCCESS
      if (register) {
        // Make sure no old login token remains.
        clearToken();

        // Switch back to login mode.
        setMode('login');

        // Keep email so the user does not need to type it again.
        setForm({
          name: '',
          company: '',
          email: form.email.trim(),
          password: '',
          confirm: ''
        });

        setSuccess(
          'Account created successfully! Please log in with your email and password.'
        );

        // IMPORTANT:
        // Do not save a token.
        // Do not call onLoggedIn().
        return;
      }

      // LOGIN SUCCESS
      if (!data.token) {
        throw new Error('Login failed. Please try again.');
      }

      setToken(data.token);

      // Open dashboard only after successful login.
      onLoggedIn();

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');

    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 to-[#2b2f8f] p-4">

      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl"
      >

        <div className="mb-6 flex items-center gap-3">

          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800">
            <Megaphone size={24} className="text-sky-400" />
          </span>

          <div>
            <h1 className="text-xl font-extrabold leading-tight">
              AdTech Platform
            </h1>

            <p className="text-sm text-slate-500">
              {register
                ? 'Create your advertiser account'
                : 'Log in to your advertiser dashboard'}
            </p>
          </div>

        </div>

        <div className="space-y-4">

          {register && (
            <>
              <div>
                <label className="label" htmlFor="name">
                  Contact person
                </label>

                <input
                  id="name"
                  required
                  className="input"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                  maxLength={80}
                />
              </div>

              <div>
                <label className="label" htmlFor="company">
                  Company name
                </label>

                <input
                  id="company"
                  required
                  className="input"
                  value={form.company}
                  onChange={set('company')}
                  autoComplete="organization"
                  maxLength={80}
                />
              </div>
            </>
          )}

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              className="input"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              minLength={register ? 8 : undefined}
              className="input"
              value={form.password}
              onChange={set('password')}
              autoComplete={register ? 'new-password' : 'current-password'}
            />

            {register && (
              <p className="mt-1 text-xs text-slate-500">
                At least 8 characters.
              </p>
            )}
          </div>

          {register && (
            <div>
              <label className="label" htmlFor="confirm">
                Confirm password
              </label>

              <input
                id="confirm"
                type="password"
                required
                className="input"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
              />
            </div>
          )}

          {success && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700"
            >
              {success}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm font-medium text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy}
          >
            {busy
              ? register
                ? 'Creating account...'
                : 'Logging in...'
              : register
                ? 'Create account'
                : 'Log in'}
          </button>

          <p className="text-center text-sm text-slate-600">

            {register
              ? 'Already have an account?'
              : 'New advertiser?'}

            {' '}

            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-brand-600 hover:underline"
            >
              {register
                ? 'Log in'
                : 'Create an account'}
            </button>

          </p>

        </div>

      </form>

    </div>
  );
}
