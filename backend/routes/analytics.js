const express = require('express');
const { campaigns, locations, invoices } = require('../data/store');
const { buildSeries, RANGES } = require('../utils/analytics');
const { withDetails } = require('./campaigns');
const { clientTotals, geoDistribution, rate } = require('../utils/stats');

const router = express.Router();

// Live campaign performance: daily playback starts / completed / interrupted
router.get('/performance', (req, res) => {
  const range = RANGES.includes(req.query.range) ? req.query.range : 'this_month';
  res.json(buildSeries(req.user.id, range));
});

// Playback report: one row per campaign, plus totals and geographic distribution
router.get('/report', (req, res) => {
  const rows = campaigns
    .filter((c) => c.ownerId === req.user.id)
    .map(withDetails)
    .map((c) => ({
      id: c.id, name: c.name, status: c.status, locationName: c.locationName, startDate: c.startDate, endDate: c.endDate,
      targetedDevices: ['Pending Approval', 'Rejected'].includes(c.status) ? 0 : c.autosBooked,
      activeDevices: c.playback.activeDevices,
      starts: c.playback.starts, completed: c.playback.completed, interrupted: c.playback.interrupted,
      completionRate: rate(c.playback.completed, c.playback.starts),
      runningHours: c.playback.runningHours,
      expenditure: invoices.filter((i) => i.campaignId === c.id).reduce((s, i) => s + i.amount, 0),
      estimatedPlaybacks: c.estimate.estimatedPlaybacks,
    }));
  res.json({ totals: clientTotals(req.user.id), geo: geoDistribution(req.user.id, locations), campaigns: rows });
});

module.exports = router;
