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
    (sum, campaign) => sum + Number(campaign.autos_booked || 0),
    0
  );
}

async function availability(locationId, startDate, endDate) {
  const { data: loc, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .maybeSingle();

  if (error) throw error;
  if (!loc) return null;

  const booked = Math.min(
    await bookedAutos(locationId, startDate, endDate),
    loc.total_autos
  );

  return {
    location: loc.id,
    name: loc.name,
    total: loc.total_autos,
    booked,
    available: loc.total_autos - booked
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

module.exports = { availability, todayIST, addDays, isDate, isTime, HOLDING };
