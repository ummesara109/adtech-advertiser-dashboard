// Estimated campaign reach. This is only a count of SCHEDULED playbacks worked out from the advertiser's own
// settings (autos x days x operating hours x plays per hour). It is not verified playback and not audience exposure.
const daysBetween = (startDate, endDate) =>
  Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1;

function hoursBetween(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 1440;
  return mins / 60;
}

function estimate({ autos, startDate, endDate, startTime, endTime, frequency }) {
  const days = daysBetween(startDate, endDate);
  const hoursPerDay = hoursBetween(startTime, endTime);
  return {
    days,
    hoursPerDay: Math.round(hoursPerDay * 10) / 10,
    estimatedPlaybacks: Math.round(autos * days * hoursPerDay * frequency),
    estimatedRunningHours: Math.round(autos * days * hoursPerDay),
  };
}

module.exports = { estimate, daysBetween, hoursBetween };
