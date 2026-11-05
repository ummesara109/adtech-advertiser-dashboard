export default function StatCard({ label, value, hint, Icon, tone }) {
  return (
    <div className="card flex items-center gap-3 overflow-hidden p-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: tone.bg }}>
        <Icon size={26} style={{ color: tone.fg }} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <p className="break-all text-2xl font-extrabold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
