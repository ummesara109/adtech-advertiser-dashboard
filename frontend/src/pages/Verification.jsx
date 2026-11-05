import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, ShieldCheck, UploadCloud } from 'lucide-react';
import { api, uploadFile, useApi } from '../api.js';
import { useApp } from '../context.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate } from '../utils/format.js';

const LABEL = { not_submitted: 'Not submitted', under_review: 'Under review', verified: 'Verified', rejected: 'Rejected' };

export default function Verification() {
  const { notify } = useApp();
  const { data, reload } = useApi('/verification');
  const [form, setForm] = useState({ legalName: '', pan: '', gstin: '' });
  const [doc, setDoc] = useState(null); // { id, name }
  const [upload, setUpload] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (data) setForm({ legalName: data.legalName || '', pan: data.pan || '', gstin: data.gstin || '' });
  }, [data]);

  if (!data) return <p className="p-6 text-slate-500">Loading verification...</p>;
  const locked = data.status === 'under_review' || data.status === 'verified';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pick = async (file) => {
    if (!file) return;
    setError('');
    setUpload({ name: file.name, pct: 0 });
    try {
      const res = await uploadFile(file, (pct) => setUpload({ name: file.name, pct }), '/api/uploads/kyc');
      setDoc({ id: res.id, name: res.name });
    } catch (e) {
      setError(e.message);
    } finally {
      setUpload(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/verification', { method: 'PUT', body: { ...form, documentId: doc?.id, documentName: doc?.name } });
      notify('Submitted. An admin will review your details.');
      setDoc(null);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Advertiser Verification</h1>
        <p className="text-sm text-slate-500">An admin checks your business details before your campaigns are approved.</p>
      </div>

      <div className="card flex items-center gap-3 p-5">
        <ShieldCheck size={28} className="text-brand-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-500">Status</p>
          <StatusBadge status={LABEL[data.status]} />
        </div>
        {data.submittedAt && <p className="text-xs text-slate-500">Submitted {formatDate(data.submittedAt)}</p>}
      </div>
      {data.status === 'rejected' && data.note && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Reason: {data.note}</p>}

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="legal">Registered business name</label>
          <input id="legal" className="input" value={form.legalName} onChange={set('legalName')} disabled={locked} maxLength={120} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pan">PAN</label>
            <input id="pan" className="input uppercase" value={form.pan} onChange={set('pan')} disabled={locked} maxLength={10} placeholder="ABCDE1234F" />
          </div>
          <div>
            <label className="label" htmlFor="gstin">GSTIN (optional)</label>
            <input id="gstin" className="input uppercase" value={form.gstin} onChange={set('gstin')} disabled={locked} maxLength={15} />
          </div>
        </div>

        <div>
          <p className="label">Business registration or GST document</p>
          {locked ? (
            <p className="flex items-center gap-2 text-sm"><FileText size={16} />{data.documentName || 'Document on file'}</p>
          ) : doc ? (
            <p className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"><CheckCircle2 size={16} className="text-emerald-600" />{doc.name}
              <button type="button" className="ml-auto text-xs font-semibold text-brand-600 hover:underline" onClick={() => { setDoc(null); if (fileRef.current) fileRef.current.value = ''; }}>Remove</button>
            </p>
          ) : (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center">
              <UploadCloud size={28} className="mb-2 text-brand-600" />
              <p className="text-xs text-slate-500">PDF, JPG or PNG, up to 5 MB</p>
              <button type="button" className="btn-soft mt-2" disabled={Boolean(upload)} onClick={() => fileRef.current?.click()}>{upload ? `Uploading ${upload.pct}%` : 'Choose document'}</button>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" aria-label="Upload verification document" onChange={(e) => pick(e.target.files?.[0])} />
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">Your documents are stored privately and are only used for verification.</p>
        </div>

        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
        {!locked && <div className="flex justify-end"><button className="btn-primary" disabled={busy || Boolean(upload)}>{busy ? 'Submitting...' : 'Submit for verification'}</button></div>}
      </form>
    </div>
  );
}
