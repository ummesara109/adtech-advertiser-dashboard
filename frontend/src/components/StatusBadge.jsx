const STYLES = {
  Active: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
  Scheduled: { dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700' },
  Approved: { dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700' },
  Completed: { dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600' },
  Paused: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' },
  'Pending Approval': { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' },
  Rejected: { dot: 'bg-red-500', pill: 'bg-red-50 text-red-700' },
  Paid: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
  Pending: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' },
  Verified: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
  'Under review': { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' },
  'Not submitted': { dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600' },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.Completed;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
