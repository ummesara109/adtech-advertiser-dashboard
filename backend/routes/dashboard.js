const express = require('express');
const supabase = require('../config/supabase');
const { clientTotals, geoDistribution } = require('../utils/stats');
const { withDetails } = require('./campaigns');

const router = express.Router();

router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = req.user.id;

    // Fetch only the fields required by the dashboard.
    // Keep queries parallel to reduce total waiting time.
    const [
      campaignResult,
      invoiceResult,
      locationResult
    ] = await Promise.all([
      supabase
        .from('campaigns')
        .select(`
          id,
          owner_id,
          name,
          description,
          location,
          autos_booked,
          ad_duration,
          frequency,
          budget,
          status,
          start_date,
          end_date,
          start_time,
          end_time,
          media,
          rejection_reason,
          submitted_at,
          decided_at,
          playback,
          daily
        `)
        .eq('owner_id', userId),

      supabase
        .from('invoices')
        .select(`
          owner_id,
          campaign_id,
          number,
          status,
          amount
        `)
        .eq('owner_id', userId),

      supabase
        .from('locations')
        .select(`
          id,
          name,
          total_autos
        `)
    ]);

    if (campaignResult.error) throw campaignResult.error;
    if (invoiceResult.error) throw invoiceResult.error;
    if (locationResult.error) throw locationResult.error;

    const campaigns = campaignResult.data || [];
    const invoices = invoiceResult.data || [];
    const locations = locationResult.data || [];

    const totals = clientTotals(userId, campaigns, invoices);

    const geo = geoDistribution(
      userId,
      campaigns,
      locations
    );

    const recentCampaigns = campaigns.slice(0, 4).map(c =>
      withDetails(c, campaigns, invoices, locations)
    );

    // Avoid caching personalized dashboard responses in shared caches.
    res.set('Cache-Control', 'private, no-store');

    console.info('Dashboard API completed', {
      durationMs: Date.now() - startTime,
      campaignCount: campaigns.length,
      invoiceCount: invoices.length,
      locationCount: locations.length
    });

    return res.json({
      user: {
        name: req.user.name,
        role: req.user.role,
        company: req.user.company
      },
      verification: req.user.verification.status,
      totals,
      geo,
      campaigns: recentCampaigns
    });

  } catch (error) {
    console.error('Dashboard error:', {
      message: error.message,
      durationMs: Date.now() - startTime
    });

    return res.status(500).json({
      error: 'Unable to load dashboard.'
    });
  }
});

module.exports = router;