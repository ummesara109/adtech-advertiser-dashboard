import { useState } from 'react';
import { useApi } from '../api.js';
import { useApp } from '../context.js';
import CampaignsTable from '../components/CampaignsTable.jsx';

const FILTERS = ['All', 'Pending Approval', 'Scheduled', 'Active', 'Paused', 'Completed', 'Rejected'];

export default function Campaigns() {
  const { navigate } = useApp();
  const [filter, setFilter] = useState('All');
  const { data, error } = useApi(`/campaigns${filter === 'All' ? '' : `?status=${encodeURIComponent(filter)}`}`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">My Campaigns</h1>
        <button className="btn-primary" onClick={() => navigate('create-campaign')}>Create campaign</button>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-brand-50'}`}>{f}</button>
        ))}
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {data && <CampaignsTable campaigns={data} />}
    </div>
  );
}
