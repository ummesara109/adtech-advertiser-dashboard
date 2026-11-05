import { useState } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import { useApp } from '../context.js';
import { formatDate, formatTime, fullNumber, hoursLabel, inr, percent } from '../utils/format.js';
import ApprovalSteps from './ApprovalSteps.jsx';
import CampaignThumb from './CampaignThumb.jsx';
import Modal from './Modal.jsx';
import StatusBadge from './StatusBadge.jsx';

function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

function CampaignDetail({ campaign: c, onClose }) {
  const played = c.playback.starts > 0;
  return (
    <Modal title={c.name} onClose={onClose}>
      <div className="mb-3 flex items-center gap-3">
        <CampaignThumb media={c.media} size={48} />
        <StatusBadge status={c.status} />
      </div>
      {c.description && <p className="mb-3 text-sm text-slate-600">{c.description}</p>}

      <h3 className="mb-2 text-sm font-bold">Approval tracking</h3>
      <ApprovalSteps steps={c.approval} />
      {c.status === 'Rejected' && c.rejectionReason && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Reason: {c.rejectionReason}</p>}
      {c.status === 'Pending Approval' && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">An admin is reviewing this campaign. It goes live only after approval.</p>}

      {c.media && (
        <div className="my-4 overflow-hidden rounded-xl bg-slate-100">
          {c.media.type === 'video' ? <video src={c.media.url} controls className="max-h-56 w-full" /> : <img src={c.media.url} alt={c.media.name || c.name} className="max-h-56 w-full object-contain" />}
        </div>
      )}

      <h3 className="mb-1 mt-4 text-sm font-bold">Campaign setup</h3>
      <dl>
        <DetailRow label="Dates">{formatDate(c.startDate)} - {formatDate(c.endDate)} ({c.duration})</DetailRow>
        <DetailRow label="Operating hours">{formatTime(c.startTime)} - {formatTime(c.endTime)}</DetailRow>
        <DetailRow label="Target location">{c.locationName}</DetailRow>
        <DetailRow label="Number of autos">{c.autosBooked}</DetailRow>
        <DetailRow label="Advertisement duration">{c.adDuration} seconds</DetailRow>
        <DetailRow label="Playback frequency">{c.frequency} per hour per auto</DetailRow>
        <DetailRow label="Campaign budget">{inr(c.budget)}</DetailRow>
        <DetailRow label="Estimated reach"><span>{fullNumber(c.estimate.estimatedPlaybacks)} scheduled playbacks</span><span className="block text-xs font-normal text-slate-500">Estimate only</span></DetailRow>
        {c.invoice && <DetailRow label="Invoice">{c.invoice.number} <StatusBadge status={c.invoice.status} /></DetailRow>}
      </dl>

      <h3 className="mb-1 mt-4 text-sm font-bold">Verified playback</h3>
      {played ? (
        <dl>
          <DetailRow label="Playback starts">{fullNumber(c.playback.starts)}</DetailRow>
          <DetailRow label="Completed">{fullNumber(c.playback.completed)}</DetailRow>
          <DetailRow label="Interrupted">{fullNumber(c.playback.interrupted)}</DetailRow>
          <DetailRow label="Completion rate">{percent(c.completionRate)}</DetailRow>
          <DetailRow label="Running hours">{hoursLabel(c.playback.runningHours)}</DetailRow>
        </dl>
      ) : (
        <p className="text-sm text-slate-500">No playback recorded yet.</p>
      )}
      <div className="mt-5 flex justify-end"><button className="btn-ghost" onClick={onClose}>Close</button></div>
    </Modal>
  );
}

export default function CampaignsTable({ campaigns, showViewAll = false }) {
  const { navigate } = useApp();
  const [selected, setSelected] = useState(null);

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Megaphone size={20} className="text-brand-600" />My Campaigns</h2>
        {showViewAll && (
          <button onClick={() => navigate('campaigns')} className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">View All <ArrowRight size={14} /></button>
        )}
      </div>

      {campaigns.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-semibold">No campaigns yet</p>
          <p className="mb-4 text-sm text-slate-500">Create your first campaign and submit it for approval.</p>
          <button className="btn-primary" onClick={() => navigate('create-campaign')}>Create campaign</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500">
                <th className="rounded-l-lg px-3 py-2.5">Campaign Name</th>
                <th className="px-3 py-2.5">Duration</th>
                <th className="px-3 py-2.5">Approval / Status</th>
                <th className="px-3 py-2.5">Playback starts</th>
                <th className="rounded-r-lg px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3"><CampaignThumb media={c.media} /><span className="font-semibold">{c.name}</span></div>
                  </td>
                  <td className="px-3 py-2.5">{c.duration}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2.5 font-medium">{c.playback.starts ? fullNumber(c.playback.starts) : '-'}</td>
                  <td className="px-3 py-2.5"><button className="btn-soft !px-4 !py-1.5" onClick={() => setSelected(c)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <CampaignDetail campaign={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
