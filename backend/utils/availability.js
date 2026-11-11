const supabase = require('../config/supabase');
const { todayIST, addDays, isDate, isTime } = require('./dates');

// Campaigns that reserve autos
const HOLDING = [
  'Pending Approval',
  'Approved',
  'Scheduled',
  'Active',
  'Paused'
];

// Calculate booked autos for the selected location and date range
async function bookedAutos(locationId, startDate, endDate) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('autos_booked')
    .eq('location', locationId)
    .in('status', HOLDING)
    .lte('start_date', endDate)
    .gte('end_date', startDate);

  if (error) throw error;

  return (data || []).reduce(
    (sum, campaign) =>
      sum + Number(campaign.autos_booked || 0),
    0
  );
}

// Calculate total, booked and available autos
async function availability(locationId, startDate, endDate) {
  const { data: loc, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .maybeSingle();

  if (error) throw error;
  if (!loc) return null;

  const total = Math.max(0, Number(loc.total_autos) || 0);

  const booked = Math.min(
    await bookedAutos(locationId, startDate, endDate),
    total
  );

  return {
    location: loc.id,
    name: loc.name,
    total,
    booked,
    available: total - booked
  };
}

module.exports = {
  availability,
  bookedAutos,
  todayIST,
  addDays,
  isDate,
  isTime,
  HOLDING
};
