const express = require('express');
const supabase = require('../config/supabase');
const { buildSeries, RANGES } = require('../utils/analytics');
const { withDetails } = require('./campaigns');
const { clientTotals, geoDistribution, rate } = require('../utils/stats');

const router = express.Router();

// Live campaign performance
router.get('/performance', async (req, res) => {
  try {
    const range = RANGES.includes(req.query.range)
      ? req.query.range
      : 'this_month';

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('owner_id', req.user.id);

    if (error) throw error;

    res.json(buildSeries(req.user.id, range, campaigns || []));
  } catch (error) {
    console.error('Performance error:', error.message);
    res.status(500).json({
      error: 'Unable to load campaign performance.'
    });
  }
});

// Playback report
router.get('/report', async (req, res) => {
  try {
    const [campaignResult, invoiceResult, locationResult] =
      await Promise.all([
        supabase
          .from('campaigns')
          .select('*')
          .eq('owner_id', req.user.id),

        supabase
          .from('invoices')
          .select('*')
          .eq('owner_id', req.user.id),

        supabase
          .from('locations')
          .select('*')
      ]);

    if (campaignResult.error) throw campaignResult.error;
    if (invoiceResult.error) throw invoiceResult.error;
    if (locationResult.error) throw locationResult.error;

    const campaigns = campaignResult.data || [];
    const invoices = invoiceResult.data || [];
    const locations = locationResult.data || [];

    const rows = campaigns
      .map(c => withDetails(c, campaigns, invoices, locations))
      .map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        locationName: c.locationName,
        startDate: c.startDate,
        endDate: c.endDate,

        targetedDevices:
          ['Pending Approval', 'Rejected'].includes(c.status)
            ? 0
            : c.autosBooked,

        activeDevices: c.playback.activeDevices || 0,
        starts: c.playback.starts || 0,
        completed: c.playback.completed || 0,
        interrupted: c.playback.interrupted || 0,

        completionRate: rate(
          c.playback.completed || 0,
          c.playback.starts || 0
        ),

        runningHours: c.playback.runningHours || 0,

        expenditure: invoices
          .filter(i => i.campaign_id === c.id)
          .reduce((sum, i) => sum + Number(i.amount || 0), 0),

        estimatedPlaybacks: c.estimate.estimatedPlaybacks
      }));

    res.json({
      totals: clientTotals(req.user.id, campaigns, invoices),
      geo: geoDistribution(req.user.id, campaigns, locations),
      campaigns: rows
    });

  } catch (error) {
    console.error('Analytics report error:', error.message);
    res.status(500).json({
      error: 'Unable to load analytics report.'
    });
  }
});

module.exports = router;
