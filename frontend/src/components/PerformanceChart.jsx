import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, ChevronDown } from 'lucide-react';
import { useApi } from '../api.js';
import { compact, fullNumber } from '../utils/format.js';

const RANGE_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_7_days', label: 'Last 7 Days' },
];

const START = '#6d4df2';
const DONE = '#16a56a';

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="text-slate-500">{p.label}</div>
      <div className="font-bold">Playback starts: {fullNumber(p.starts)}</div>
      <div className="font-bold">Completed: {fullNumber(p.completed)}</div>
      <div className="font-bold">Interrupted: {fullNumber(p.interrupted)}</div>
    </div>
  );
}

export default function PerformanceChart({ range, onRangeChange, height = 230 }) {
  const { data, loading, error } = useApi(`/analytics/performance?range=${range}`);
  const hasData = data?.points.some((p) => p.starts > 0);

  return (
    <section className="card p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BarChart3 size={20} className="text-brand-600" />
            Live Campaign Performance
          </h2>
          <p className="text-xs text-slate-500">Verified playback events from your campaigns' devices, per day.</p>
        </div>
        <label className="relative">
          <span className="sr-only">Date range</span>
          <select value={range} onChange={(e) => onRangeChange(e.target.value)} className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium outline-none focus:border-brand-500">
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
        </label>
      </div>

      <div className="mb-1 flex justify-center gap-6 text-xs font-medium text-slate-600">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: START }} />Playback starts</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: DONE }} />Completed</span>
      </div>

      <div style={{ height }}>
        {error && <p className="py-10 text-center text-sm text-red-600">{error}</p>}
        {!error && data && !hasData && <p className="py-12 text-center text-sm text-slate-500">No playback recorded in this period yet.</p>}
        {!error && data && hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.points} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gStart" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={START} stopOpacity={0.22} /><stop offset="100%" stopColor={START} stopOpacity={0.02} /></linearGradient>
                <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={DONE} stopOpacity={0.2} /><stop offset="100%" stopColor={DONE} stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#eceffa" />
              <XAxis dataKey="label" ticks={data.ticks} tickLine={false} axisLine={{ stroke: '#e3e6f4' }} tick={{ fontSize: 11, fill: '#64708f' }} />
              <YAxis tickFormatter={(v) => (v === 0 ? '0' : compact(v))} tickLine={false} axisLine={false} width={42} tick={{ fontSize: 11, fill: '#64708f' }} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: START, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="starts" stroke={START} strokeWidth={2} fill="url(#gStart)" dot={false} activeDot={{ r: 5, fill: START, stroke: '#fff' }} />
              <Area type="monotone" dataKey="completed" stroke={DONE} strokeWidth={2} fill="url(#gDone)" dot={false} activeDot={{ r: 5, fill: DONE, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {loading && !data && <p className="py-10 text-center text-sm text-slate-500">Loading chart...</p>}
      </div>
    </section>
  );
}
