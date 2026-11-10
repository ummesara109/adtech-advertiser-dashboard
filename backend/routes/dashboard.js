const express = require('express');
const supabase = require('../config/supabase');
const { clientTotals, geoDistribution } = require('../utils/stats');
const { withDetails } = require('./campaigns');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      campaignResult,
      invoiceResult,
      locationResult
    ] = await Promise.all([
      supabase.from('campaigns').select('*').eq('owner_id', userId),
      supabase.from('invoices').select('*').eq('owner_id', userId),
      supabase.from('locations').select('*')
    ]);

    if (campaignResult.error) throw campaignResult.error;
    if (invoiceResult.error) throw invoiceResult.error;
    if (locationResult.error) throw locationResult.error;

    const campaigns = campaignResult.data || [];
    const invoices = invoiceResult.data || [];
    const locations = locationResult.data || [];

    const totals = clientTotals(userId, campaigns, invoices);
    const geo = geoDistribution(userId, campaigns, locations);

    res.json({
      user: {
        name: req.user.name,
        role: req.user.role,
        company: req.user.company
      },
      verification: req.user.verification.status,
      totals,
      geo,
      campaigns: campaigns.slice(0, 4).map((c) =>
        withDetails(c, campaigns, invoices, locations)
      )
    });
  } catch (error) {
    console.error('Dashboard error:', error.message);
    res.status(500).json({
      error: 'Unable to load dashboard.'
    });
  }
});

module.exports = router;
