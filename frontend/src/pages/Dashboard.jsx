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
import {
  fullNumber,
  hoursLabel,
  inr,
  percent
} from '../utils/format.js';

import CampaignsTable from '../components/CampaignsTable.jsx';
import PerformanceChart from '../components/PerformanceChart.jsx';
import QuickActions from '../components/QuickActions.jsx';
import StatCard from '../components/StatCard.jsx';
import WelcomeBanner from '../components/WelcomeBanner.jsx';

const VERIFY_TEXT = {
  not_submitted:
    'Your business is not verified yet. Submit your details so an admin can verify you.',
  under_review:
    'Your verification is under review.',
  rejected:
    'Your verification was rejected. Check the reason and submit again.'
};

const EMPTY_TOTALS = {
  targetedDevices: 0,
  activeDevices: 0,
  starts: 0,
  completed: 0,
  interrupted: 0,
  completionRate: 0,
  runningHours: 0,
  invoiced: 0,
  paid: 0,
  approval: {
    pending: 0,
    approved: 0,
    rejected: 0
  }
};

export default function Dashboard() {
  const { navigate } = useApp();

  const {
    data,
    error,
    loading,
    reload
  } = useApi('/dashboard');

  const [range, setRange] = useState('this_month');

  // Use real data when available.
  // Until then, show placeholders instead of fake statistics.
  const hasData = Boolean(data);
  const t = data?.totals || EMPTY_TOTALS;
  const a = t.approval || EMPTY_TOTALS.approval;

  const displayValue = (value) => (
    hasData ? value : '—'
  );

  const tone = (bg, fg) => ({ bg, fg });

  const cards = [
    {
      id: 'targeted',
      label: 'Total Targeted Devices',
      value: displayValue(fullNumber(t.targetedDevices)),
      hint: 'Autos in approved campaigns',
      Icon: MonitorSmartphone,
      tone: tone('#e3f0ff', '#1b7ee6')
    },
    {
      id: 'active',
      label: 'Active Devices',
      value: displayValue(fullNumber(t.activeDevices)),
      hint: 'Playing now',
      Icon: Activity,
      tone: tone('#e1f7eb', '#15965c')
    },
    {
      id: 'starts',
      label: 'Total Playback Starts',
      value: displayValue(fullNumber(t.starts)),
      Icon: PlayCircle,
      tone: tone('#ebe8ff', '#6a5af9')
    },
    {
      id: 'completed',
      label: 'Completed Advertisements',
      value: displayValue(fullNumber(t.completed)),
      Icon: CheckCircle2,
      tone: tone('#dcf5e9', '#16a56a')
    },
    {
      id: 'interrupted',
      label: 'Interrupted Advertisements',
      value: displayValue(fullNumber(t.interrupted)),
      Icon: XCircle,
      tone: tone('#fde8e8', '#dc2626')
    },
    {
      id: 'rate',
      label: 'Playback Completion Rate',
      value: displayValue(percent(t.completionRate)),
      Icon: Percent,
      tone: tone('#e0f7f4', '#0f9488')
    },
    {
      id: 'hours',
      label: 'Campaign Running Hours',
      value: displayValue(hoursLabel(t.runningHours)),
      Icon: Clock,
      tone: tone('#fff0d6', '#f08c00')
    },
    {
      id: 'spend',
      label: 'Campaign Expenditure',
      value: displayValue(inr(t.invoiced)),
      hint: hasData ? `${inr(t.paid)} paid` : 'Loading...',
      Icon: IndianRupee,
      tone: tone('#fff0d6', '#f08c00')
    }
  ];

  const geo = data?.geo || [];
  const campaigns = data?.campaigns || [];

  const maxStarts = Math.max(
    1,
    ...geo.map((g) => Number(g.starts) || 0)
  );

  return (
    <div className="space-y-5">

      {/* Background loading and error messages */}
      {loading && !hasData && (
        <div
          className="flex items-center gap-2 text-xs text-slate-500"
          role="status"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
          Loading your latest dashboard statistics...
        </div>
      )}

      {error && !hasData && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={reload}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Welcome section */}
      <WelcomeBanner
        name={data?.user?.name || 'there'}
      />

      {/* Verification notice */}
      {data && data.verification !== 'verified' && (
        <button
          type="button"
          onClick={() => navigate('verification')}
          className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          <ShieldAlert size={20} className="shrink-0" />

          <span>
            {VERIFY_TEXT[data.verification] ||
              'Please complete your business verification.'}

            {' '}

            <span className="font-bold underline">
              Open verification
            </span>
          </span>
        </button>
      )}

      {/* Dashboard statistics */}
      <section
        aria-labelledby="overview-heading"
        className="space-y-3"
      >
        <div>
          <h2
            id="overview-heading"
            className="text-lg font-extrabold text-slate-800"
          >
            Dashboard Overview
          </h2>

          <p className="text-sm text-slate-500">
            Verified playback from your campaigns' devices.
            Playback does not prove that a passenger saw your ad.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              key={card.id}
              {...card}
            />
          ))}
        </div>
      </section>

      {/* Performance chart */}
      <PerformanceChart
        range={range}
        onRangeChange={setRange}
      />

      {/* Approval and geographic information */}
      <div className="grid gap-5 lg:grid-cols-2">

        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <ShieldCheck
              size={20}
              className="text-brand-600"
            />
            Campaign Approval Tracking
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center">

            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-2xl font-extrabold text-amber-700">
                {displayValue(fullNumber(a.pending))}
              </p>
              <p className="text-xs font-semibold text-amber-800">
                Pending approval
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-2xl font-extrabold text-emerald-700">
                {displayValue(fullNumber(a.approved))}
              </p>
              <p className="text-xs font-semibold text-emerald-800">
                Approved
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-2xl font-extrabold text-red-700">
                {displayValue(fullNumber(a.rejected))}
              </p>
              <p className="text-xs font-semibold text-red-800">
                Rejected
              </p>
            </div>

          </div>

          <p className="mt-3 text-xs text-slate-500">
            Open a campaign in My Campaigns to see where it is in the review.
          </p>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <MapPin
              size={20}
              className="text-brand-600"
            />
            Geographic Campaign Distribution
          </h2>

          {!hasData ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Loading geographic information...
            </p>
          ) : geo.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Locations appear here once a campaign is approved.
            </p>
          ) : (
            <ul className="space-y-3">
              {geo.map((g) => (
                <li key={g.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">
                      {g.name}
                    </span>

                    <span className="text-slate-500">
                      {g.autos} autos · {fullNumber(g.starts)} starts
                    </span>
                  </div>

                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{
                        width: `${Math.max(
                          2,
                          ((Number(g.starts) || 0) / maxStarts) * 100
                        )}%`
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>

      {/* Campaigns and quick actions */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

        <CampaignsTable
          campaigns={campaigns}
          showViewAll
        />

        <QuickActions />

      </div>

    </div>
  );
}