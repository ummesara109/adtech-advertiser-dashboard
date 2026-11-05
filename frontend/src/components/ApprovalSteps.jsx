import { Check, X } from 'lucide-react';
import { formatDate } from '../utils/format.js';

// Campaign approval tracking: Submitted > Admin review > Approved / Rejected > Live
export default function ApprovalSteps({ steps }) {
  return (
    <ol className="flex items-start" aria-label="Approval progress">
      {steps.map((s, i) => {
        const done = s.state === 'done';
        const bad = s.state === 'rejected';
        const cur = s.state === 'current';
        return (
          <li key={s.key} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? 'bg-transparent' : done || cur || bad ? 'bg-brand-500' : 'bg-slate-200'}`} />
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${bad ? 'bg-red-500 text-white' : done ? 'bg-emerald-500 text-white' : cur ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-500'}`}>
                {bad ? <X size={14} /> : done ? <Check size={14} /> : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === steps.length - 1 ? 'bg-transparent' : done ? 'bg-brand-500' : 'bg-slate-200'}`} />
            </div>
            <p className={`mt-1.5 text-xs font-semibold ${bad ? 'text-red-600' : s.state === 'todo' ? 'text-slate-400' : 'text-slate-700'}`}>{s.label}</p>
            {s.date && s.state !== 'todo' && <p className="text-[11px] text-slate-500">{formatDate(s.date)}</p>}
          </li>
        );
      })}
    </ol>
  );
}
