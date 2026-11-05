const { campaigns, invoices } = require('../data/store');

const TARGETING = ['Approved', 'Scheduled', 'Active', 'Paused', 'Completed']; // approved campaigns that target devices
const rate = (completed, starts) => (starts ? Math.round((completed / starts) * 1000) / 10 : null);

// Advertiser analytics from the doc: targeted devices, active devices, playback starts, completed, interrupted,
// completion rate, running hours, expenditure, plus approval tracking and geographic distribution.
function clientTotals(userId) {
  const mine = campaigns.filter((c) => c.ownerId === userId);
  const live = mine.filter((c) => TARGETING.includes(c.status));
  const sum = (list, f) => list.reduce((s, c) => s + f(c), 0);
  const starts = sum(mine, (c) => c.playback.starts);
  const completed = sum(mine, (c) => c.playback.completed);
  const inv = invoices.filter((i) => i.ownerId === userId);

  return {
    targetedDevices: sum(live, (c) => c.autosBooked),
    activeDevices: sum(mine.filter((c) => c.status === 'Active'), (c) => c.playback.activeDevices),
    starts,
    completed,
    interrupted: sum(mine, (c) => c.playback.interrupted),
    completionRate: rate(completed, starts),
    runningHours: sum(mine, (c) => c.playback.runningHours),
    invoiced: sum(inv, (i) => i.amount),
    paid: sum(inv.filter((i) => i.status === 'Paid'), (i) => i.amount),
    approval: {
      pending: mine.filter((c) => c.status === 'Pending Approval').length,
      approved: mine.filter((c) => ['Approved', 'Scheduled', 'Active', 'Paused', 'Completed'].includes(c.status)).length,
      rejected: mine.filter((c) => c.status === 'Rejected').length,
      total: mine.length,
    },
  };
}

function geoDistribution(userId, locations) {
  return locations
    .map((l) => {
      const list = campaigns.filter((c) => c.ownerId === userId && c.location === l.id && TARGETING.includes(c.status));
      const s = (f) => list.reduce((t, c) => t + f(c), 0);
      return { id: l.id, name: l.name, campaigns: list.length, autos: s((c) => c.autosBooked), starts: s((c) => c.playback.starts), completed: s((c) => c.playback.completed) };
    })
    .filter((g) => g.campaigns > 0)
    .sort((a, b) => b.starts - a.starts || b.autos - a.autos);
}

module.exports = { clientTotals, geoDistribution, rate, TARGETING };
