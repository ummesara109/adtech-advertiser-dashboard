import { useState } from 'react';
import { Info } from 'lucide-react';
import { useApi } from '../api.js';
import { fullNumber, hoursLabel, inr, percent } from '../utils/format.js';
import PerformanceChart from '../components/PerformanceChart.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const TH = 'px-3 py-2.5';

export default function Analytics() {
  const [range, setRange] = useState('this_month');
  const { data, error } = useApi('/analytics/report');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Playback Reports</h1>
        <p className="text-sm text-slate-500">Live campaign performance and playback reports for your campaigns.</p>
      </div>

      <section className="card space-y-3 p-5" aria-labelledby="measure-heading">
        <h2 id="measure-heading" className="flex items-center gap-2 text-base font-bold"><Info size={18} className="text-brand-600" />How to read these numbers</h2>
        <dl className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-3"><dt className="font-bold text-emerald-800">Verified playback</dt><dd className="text-slate-700">Playback events reported by the device and validated by the platform. Shown in every report below.</dd></div>
          <div className="rounded-xl bg-amber-50 p-3"><dt className="font-bold text-amber-800">Estimated reach</dt><dd className="text-slate-700">A forecast of scheduled playbacks worked out from your campaign settings. It is an estimate, not a result.</dd></div>
          <div className="rounded-xl bg-slate-100 p-3"><dt className="font-bold text-slate-700">Independently verified exposure</dt><dd className="text-slate-700">Not available. Device playback does not establish that a passenger or any person saw the ad.</dd></div>
        </dl>
      </section>

      <PerformanceChart range={range} onRangeChange={setRange} height={320} />

      {error && <p className="text-red-600">{error}</p>}
      {data && (
        <>
          <section className="card overflow-x-auto p-5">
            <h2 className="mb-3 text-lg font-bold">Playback by campaign</h2>
            {data.campaigns.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No campaigns yet.</p>
            ) : (
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <th className={`rounded-l-lg ${TH}`}>Campaign</th><th className={TH}>Status</th><th className={TH}>Targeted devices</th><th className={TH}>Active devices</th>
                    <th className={TH}>Playback starts</th><th className={TH}>Completed</th><th className={TH}>Interrupted</th><th className={TH}>Completion rate</th>
                    <th className={TH}>Running hours</th><th className={`rounded-r-lg ${TH}`}>Expenditure</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2.5"><p className="font-semibold">{c.name}</p><p className="text-xs text-slate-500">{c.locationName}</p></td>
                      <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                      <td className="px-3 py-2.5">{fullNumber(c.targetedDevices)}</td>
                      <td className="px-3 py-2.5">{fullNumber(c.activeDevices)}</td>
                      <td className="px-3 py-2.5">{fullNumber(c.starts)}</td>
                      <td className="px-3 py-2.5">{fullNumber(c.completed)}</td>
                      <td className="px-3 py-2.5">{fullNumber(c.interrupted)}</td>
                      <td className="px-3 py-2.5">{percent(c.completionRate)}</td>
                      <td className="px-3 py-2.5">{hoursLabel(c.runningHours)}</td>
                      <td className="px-3 py-2.5">{c.expenditure ? inr(c.expenditure) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td className="rounded-l-lg px-3 py-2.5" colSpan={2}>Total</td>
                    <td className="px-3 py-2.5">{fullNumber(data.totals.targetedDevices)}</td><td className="px-3 py-2.5">{fullNumber(data.totals.activeDevices)}</td>
                    <td className="px-3 py-2.5">{fullNumber(data.totals.starts)}</td><td className="px-3 py-2.5">{fullNumber(data.totals.completed)}</td>
                    <td className="px-3 py-2.5">{fullNumber(data.totals.interrupted)}</td><td className="px-3 py-2.5">{percent(data.totals.completionRate)}</td>
                    <td className="px-3 py-2.5">{hoursLabel(data.totals.runningHours)}</td><td className="rounded-r-lg px-3 py-2.5">{inr(data.totals.invoiced)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </section>

          <section className="card overflow-x-auto p-5">
            <h2 className="mb-3 text-lg font-bold">Geographic distribution</h2>
            {data.geo.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Locations appear here once a campaign is approved.</p>
            ) : (
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-500"><th className={`rounded-l-lg ${TH}`}>Location</th><th className={TH}>Campaigns</th><th className={TH}>Autos</th><th className={TH}>Playback starts</th><th className={`rounded-r-lg ${TH}`}>Completed</th></tr></thead>
                <tbody>
                  {data.geo.map((g) => (
                    <tr key={g.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-2.5 font-semibold">{g.name}</td><td className="px-3 py-2.5">{g.campaigns}</td><td className="px-3 py-2.5">{g.autos}</td><td className="px-3 py-2.5">{fullNumber(g.starts)}</td><td className="px-3 py-2.5">{fullNumber(g.completed)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
