import { useApi } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, inr } from '../utils/format.js';

export default function Invoices() {
  const { data, error } = useApi('/invoices');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Invoices & Payments</h1>
        <p className="text-sm text-slate-500">Invoices are issued by the platform after a campaign is approved.</p>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Total invoiced</p><p className="text-2xl font-extrabold">{inr(data.totalInvoiced)}</p></div>
            <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Paid</p><p className="text-2xl font-extrabold">{inr(data.totalPaid)}</p></div>
            <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Pending</p><p className="text-2xl font-extrabold">{inr(data.totalPending)}</p></div>
          </div>
          <div className="card overflow-x-auto p-5">
            <h2 className="mb-3 text-lg font-bold">Invoice and payment history</h2>
            {data.invoices.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No invoices yet. One is issued when an admin approves a campaign.</p>
            ) : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <th className="rounded-l-lg px-3 py-2.5">Invoice</th><th className="px-3 py-2.5">Issued</th><th className="px-3 py-2.5">Campaign</th><th className="px-3 py-2.5">Amount</th>
                    <th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Paid on</th><th className="rounded-r-lg px-3 py-2.5">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((i) => (
                    <tr key={i.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 font-semibold">{i.number}</td>
                      <td className="px-3 py-3">{formatDate(i.issuedAt)}</td>
                      <td className="px-3 py-3">{i.description}</td>
                      <td className="px-3 py-3 font-semibold">{inr(i.amount)}</td>
                      <td className="px-3 py-3"><StatusBadge status={i.status} /></td>
                      <td className="px-3 py-3">{i.paidAt ? formatDate(i.paidAt) : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{i.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
