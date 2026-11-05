// Daily playback series built from the validated playback records stored on each campaign.
const { campaigns } = require('../data/store');
const { todayIST, addDays } = require('./dates');

const RANGES = ['this_month', 'last_month', 'last_7_days'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = (iso) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;

function rangeDates(range) {
  const today = todayIST();
  if (range === 'last_7_days') return [addDays(today, -6), today];
  const first = `${today.slice(0, 8)}01`;
  if (range === 'this_month') return [first, today];
  const lastDayPrev = addDays(first, -1);
  return [`${lastDayPrev.slice(0, 8)}01`, lastDayPrev];
}

function buildSeries(userId, range) {
  const [from, to] = rangeDates(range);
  const mine = campaigns.filter((c) => c.ownerId === userId);
  const points = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const p = { date: d, label: label(d), starts: 0, completed: 0, interrupted: 0 };
    mine.forEach((c) => {
      const day = c.daily[d];
      if (day) { p.starts += day.starts; p.completed += day.completed; p.interrupted += day.interrupted; }
    });
    points.push(p);
  }
  const step = Math.max(1, Math.floor((points.length - 1) / 4));
  const ticks = points.filter((_, i) => i % step === 0).map((p) => p.label);
  return { range, from, to, ticks, points };
}

module.exports = { buildSeries, RANGES };
