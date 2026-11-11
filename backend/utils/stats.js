const TARGETING = [
  'Approved',
  'Scheduled',
  'Active',
  'Paused',
  'Completed'
];

const rate = (completed, starts) =>
  starts ? Math.round((completed / starts) * 1000) / 10 : null;

function clientTotals(userId, campaigns = [], invoices = []) {
  const mine = campaigns.filter((c) => c.owner_id === userId);

  const live = mine.filter((c) => TARGETING.includes(c.status));

  const sum = (list, fn) =>
    list.reduce((total, item) => total + (Number(fn(item)) || 0), 0);

  const starts = sum(mine, (c) => c.playback?.starts);
  const completed = sum(mine, (c) => c.playback?.completed);

  const myInvoices = invoices.filter((i) => i.owner_id === userId);

  return {
    targetedDevices: sum(live, (c) => c.autos_booked),

    activeDevices: sum(
      mine.filter((c) => c.status === 'Active'),
      (c) => c.playback?.activeDevices
    ),

    starts,
    completed,

    interrupted: sum(mine, (c) => c.playback?.interrupted),

    completionRate: rate(completed, starts),

    runningHours: sum(mine, (c) => c.playback?.runningHours),

    invoiced: sum(myInvoices, (i) => i.amount),

    paid: sum(
      myInvoices.filter((i) => i.status === 'Paid'),
      (i) => i.amount
    ),

    approval: {
      pending: mine.filter((c) => c.status === 'Pending Approval').length,

      approved: mine.filter((c) =>
        TARGETING.includes(c.status)
      ).length,

      rejected: mine.filter((c) => c.status === 'Rejected').length,

      total: mine.length
    }
  };
}

function geoDistribution(userId, campaigns = [], locations = []) {
  const mine = campaigns.filter((c) => c.owner_id === userId);

  return locations
    .map((location) => {
      const matching = mine.filter(
        (c) => c.location === location.id
      );

      return {
        id: location.id,
        name: location.name,
        totalAutos: Number(location.total_autos) || 0,

        autos: matching.reduce(
          (sum, c) => sum + (Number(c.autos_booked) || 0),
          0
        ),

        starts: matching.reduce(
          (sum, c) => sum + (Number(c.playback?.starts) || 0),
          0
        )
      };
    })
    .filter((location) => location.autos > 0 || location.starts > 0);
}

module.exports = {
  clientTotals,
  geoDistribution,
  rate,
  TARGETING
};
