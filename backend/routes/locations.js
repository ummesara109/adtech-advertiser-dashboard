const express = require('express');
const { locations } = require('../data/store');
const { availability, todayIST, isDate } = require('../utils/availability');

const router = express.Router();

router.get('/', (req, res) => res.json(locations));

// GET /api/locations/:id/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/:id/availability', (req, res) => {
  const startDate = req.query.startDate || todayIST();
  const endDate = req.query.endDate || startDate;
  if (!isDate(startDate) || !isDate(endDate) || endDate < startDate) {
    return res.status(400).json({ error: 'Choose a valid start and end date.' });
  }
  const result = availability(req.params.id, startDate, endDate);
  if (!result) return res.status(404).json({ error: 'Location not found.' });
  res.json({ ...result, startDate, endDate });
});

module.exports = router;
