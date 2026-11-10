const { todayIST, addDays } = require('./dates');

const RANGES = ['this_month', 'last_month', 'last_7_days'];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const label = (iso) =>
  `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;

function rangeDates(range) {
  const today = todayIST();

  if (range === 'last_7_days') {
    return [addDays(today, -6), today];
  }

  const first = `${today.slice(0, 8)}01`;

  if (range === 'this_month') {
    return [first, today];
  }

  const lastDayPrev = addDays(first, -1);

  return [`${lastDayPrev.slice(0, 8)}01`, lastDayPrev];
}

function buildSeries(userId, range, campaigns = []) {
  if (!RANGES.includes(range)) {
    range = 'this_month';
  }

  const [from, to] = rangeDates(range);

  const mine = campaigns.filter(
    campaign => campaign.owner_id === userId
  );

  const points = [];

  for (let d = from; d <= to; d = addDays(d, 1)) {
    const point = {
      date: d,
      label: label(d),
      starts: 0,
      completed: 0,
      interrupted: 0
    };

    mine.forEach(campaign => {
      const day = campaign.daily?.[d];

      if (day) {
        point.starts += Number(day.starts || 0);
        point.completed += Number(day.completed || 0);
        point.interrupted += Number(day.interrupted || 0);
      }
    });

    points.push(point);
  }

  const step = Math.max(
    1,
    Math.floor((points.length - 1) / 4)
  );

  const ticks = points
    .filter((_, index) => index % step === 0)
    .map(point => point.label);

  return {
    range,
    from,
    to,
    ticks,
    points
  };
}

module.exports = {
  buildSeries,
  RANGES
};
