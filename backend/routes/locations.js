const express = require('express');
const supabase = require('../config/supabase');
const {
  availability,
  todayIST,
  isDate
} = require('../utils/availability');

const router = express.Router();

// Get all locations
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*');

    if (error) throw error;

    const locations = (data || []).map(location => ({
      id: location.id,
      name: location.name,
      totalAutos: location.total_autos
    }));

    res.json(locations);
  } catch (error) {
    console.error('Locations error:', error.message);
    res.status(500).json({ error: 'Unable to load locations.' });
  }
});

// Get location availability
router.get('/:id/availability', async (req, res) => {
  try {
    const startDate = req.query.startDate || todayIST();
    const endDate = req.query.endDate || startDate;

    if (
      !isDate(startDate) ||
      !isDate(endDate) ||
      endDate < startDate
    ) {
      return res.status(400).json({
        error: 'Choose a valid start and end date.'
      });
    }

    const result = await availability(
      req.params.id,
      startDate,
      endDate
    );

    if (!result) {
      return res.status(404).json({
        error: 'Location not found.'
      });
    }

    res.json({ ...result, startDate, endDate });
  } catch (error) {
    console.error('Availability error:', error.message);
    res.status(500).json({
      error: 'Unable to check location availability.'
    });
  }
});

module.exports = router;