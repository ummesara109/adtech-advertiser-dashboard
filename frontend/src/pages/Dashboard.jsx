import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  MonitorSmartphone,
  Percent,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  XCircle
} from 'lucide-react';

import { useApi } from '../api.js';
import { useApp } from '../context.js';
import { fullNumber, hoursLabel, inr, percent } from '../utils/format.js';
import CampaignsTable from '../components/CampaignsTable.jsx';
import PerformanceChart from '../components/PerformanceChart.jsx';
import QuickActions from '../components/QuickActions.jsx';
import StatCard from '../components/StatCard.jsx';
import WelcomeBanner from '../components/WelcomeBanner.jsx';

const VERIFY_TEXT = {
  not_submitted: 'Your business is not verified yet. Submit your details so an admin can verify you.',
  under_review: 'Your verification is under review.',
  rejected: 'Your verification was rejected. Check the reason and submit again.'
};

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-20 rounded-xl bg-slate-200" />

      <section className="space-y-3">
        <div className="h-6 w-52 rounded bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-100" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="card space-y-4 p-5">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-8 w-24 rounded bg-slate-200" />
              <div className="h-3 w-28 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </section>

      <div className="card space-y-4 p-5">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="h-64 rounded-lg bg-slate-100" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card h-48 p-5" />
        <div className="card h-48 p-5" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="card h-64 p-5" />
        <div className="card h-64 p-5" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { navigate } = useApp();
  const { data, error, loading } = useApi('/dashboard');
  const [range, setRange] = useState('this_month');

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return <p className="card p-6 text-red-600">{error}</p>;
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const t = data.totals;
  const tone = (bg, fg) => ({ bg, fg });

  const cards = [
    {
      id: 'targeted',
      label: 'Total Targeted Devices',
      value: fullNumber(t.targetedDevices),
      hint: 'Autos in approved campaigns',
      Icon: MonitorSmartphone,
      tone: tone('#e3f0ff', '#1b7ee6')
    },
    {
      id: 'active',
      label: 'Active Devices',
      value: fullNumber(t.activeDevices),
      hint: 'Playing now',
      Icon: Activity,
      tone: tone('#e1f7eb', '#15965c')
    },
    {
      id: 'starts',
      label: 'Total Playback Starts',
      value: fullNumber(t.starts),
      Icon: PlayCircle,
      tone: tone('#ebe8ff', '#6a5af9')
    },
    {
      id: 'completed',
      label: 'Completed Advertisements',
      value: fullNumber(t.completed),
      Icon: CheckCircle2,
      tone: tone('#dcf5e9', '#16a56a')
    },
    {
      id: 'interrupted',
      label: 'Interrupted Advertisements',
      value: fullNumber(t.interrupted),
      Icon: XCircle,
      tone: tone('#fde8e8', '#dc2626')
    },
    {
      id: 'rate',
      label: 'Playback Completion Rate',
      value: percent(t.completionRate),
      Icon: Percent,
      tone: tone('#e0f7f4', '#0f9488')
    },
    {
      id: 'hours',
      label: 'Campaign Running Hours',
      value: hoursLabel(t.runningHours),
      Icon: Clock,
      tone: tone('#fff0d6', '#f08c00')
    },
    {
      id: 'spend',
      label: 'Campaign Expenditure',
      value: inr(t.invoiced),
      hint: `${inr(t.paid)} paid`,
      Icon: IndianRupee,
      tone: tone('#fff0d6', '#f08c00')
    }
  ];

  const a = t.approval;
  const geo = data.geo || [];
  const maxStarts = Math.max(1, ...geo.map((g) => g.starts));

  return (
    <div className="space-y-5">
      <WelcomeBanner name={data.user.name} />

      {data.verification !== 'verified' && (
        <button
          onClick={() => navigate('verification')}
          className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          <ShieldAlert size={20} className="shrink-0" />
          <span>
            {VERIFY_TEXT[data.verification]}
            {' '}
            <span className="font-bold underline">
              Open verification
            </span>
          </span>
        </button>
      )}

      <section aria-labelledby="overview-heading" className="space-y-3">
        <div>
          <h2 id="overview-heading" className="text-lg font-extrabold text-slate-800">
            Dashboard Overview
          </h2>
          <p className="text-sm text-slate-500">
            Verified playback from your campaigns' devices. Playback does not prove that a passenger saw your ad.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard key={card.id} {...card} />
          ))}
        </div>
      </section>

      <PerformanceChart range={range} onRangeChange={setRange} />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <ShieldCheck size={20} className="text-brand-600" />
            Campaign Approval Tracking
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-2xl font-extrabold text-amber-700">{a.pending}</p>
              <p className="text-xs font-semibold text-amber-800">Pending approval</p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-2xl font-extrabold text-emerald-700">{a.approved}</p>
              <p className="text-xs font-semibold text-emerald-800">Approved</p>
            </div>

            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-2xl font-extrabold text-red-700">{a.rejected}</p>
              <p className="text-xs font-semibold text-red-800">Rejected</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Open a campaign in My Campaigns to see where it is in the review.
          </p>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <MapPin size={20} className="text-brand-600" />
            Geographic Campaign Distribution
          </h2>

          {geo.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Locations appear here once a campaign is approved.
            </p>
          ) : (
            <ul className="space-y-3">
              {geo.map((g) => (
                <li key={g.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{g.name}</span>
                    <span className="text-slate-500">
                      {g.autos} autos · {fullNumber(g.starts)} starts
                    </span>
                  </div>

                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{
                        width: `${Math.max(2, (g.starts / maxStarts) * 100)}%`
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <CampaignsTable campaigns={data.campaigns} showViewAll />
        <QuickActions />
      </div>
    </div>
  );
}