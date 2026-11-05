const express = require('express');
const { campaigns, locations } = require('../data/store');
const { withDetails } = require('./campaigns');
const { clientTotals, geoDistribution } = require('../utils/stats');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    user: { name: req.user.name, role: req.user.role, company: req.user.company },
    verification: req.user.verification.status,
    totals: clientTotals(req.user.id),
    geo: geoDistribution(req.user.id, locations),
    campaigns: campaigns.filter((c) => c.ownerId === req.user.id).slice(0, 4).map(withDetails),
  });
});

module.exports = router;
