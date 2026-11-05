const { campaigns, locations } = require('../data/store');
const { todayIST, addDays, isDate, isTime } = require('./dates');

// Statuses that keep autos reserved while the campaign is in the pipeline or running
const HOLDING = ['Pending Approval', 'Approved', 'Scheduled', 'Active', 'Paused'];

function bookedAutos(locationId, startDate, endDate) {
  return campaigns
    .filter((c) => c.location === locationId && HOLDING.includes(c.status) && c.startDate <= endDate && c.endDate >= startDate)
    .reduce((sum, c) => sum + (c.autosBooked || 0), 0);
}

function availability(locationId, startDate, endDate) {
  const loc = locations.find((l) => l.id === locationId);
  if (!loc) return null;
  const booked = Math.min(bookedAutos(locationId, startDate, endDate), loc.totalAutos);
  return { location: loc.id, name: loc.name, total: loc.totalAutos, booked, available: loc.totalAutos - booked };
}


module.exports = { availability, todayIST, addDays, isDate, isTime, HOLDING };
