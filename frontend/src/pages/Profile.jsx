import { useEffect, useState } from 'react';
import { api, useApi } from '../api.js';
import { useApp } from '../context.js';

export default function Profile() {
  const { notify, refreshUser } = useApp();
  const { data } = useApi('/profile');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm({ name: data.name, email: data.email, phone: data.phone, company: data.company, address: data.address || '' });
  }, [data]);

  if (!form) return <p className="p-6 text-slate-500">Loading profile...</p>;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/profile', { method: 'PUT', body: form });
      await refreshUser();
      notify('Profile saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold">Company Profile</h1>
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pname">
              Contact person
            </label>
            <input id="pname" className="input" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label" htmlFor="pemail">
              Email
            </label>
            <input id="pemail" type="email" className="input" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label" htmlFor="pphone">
              Phone
            </label>
            <input id="pphone" className="input" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label" htmlFor="pcompany">
              Company name
            </label>
            <input id="pcompany" className="input" value={form.company} onChange={set('company')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="paddress">
              Business address
            </label>
            <input id="paddress" className="input" value={form.address} onChange={set('address')} maxLength={200} />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button className="btn-primary" disabled={busy}>
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
