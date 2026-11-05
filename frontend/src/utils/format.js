export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export const fullNumber = (n) => Number(n || 0).toLocaleString('en-IN');

export function compact(n) {
  if (n >= 1000) return `${(Math.round(n / 100) / 10).toString().replace(/\.0$/, '')}K`;
  return String(n);
}

export function formatDate(iso) {
  if (!iso) return '-';
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(hhmm) {
  if (!hhmm) return '-';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Today's date in the browser's time zone as YYYY-MM-DD
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const percent = (n) => (n == null ? '-' : `${n}%`);

export const hoursLabel = (n) => `${Number(n || 0).toLocaleString('en-IN')} hrs`;
