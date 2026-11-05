const express = require('express');
const fs = require('fs');
const path = require('path');
const { campaigns, locations, invoices, newId } = require('../data/store');
const { availability, todayIST, isDate, isTime } = require('../utils/availability');
const { UPLOAD_DIR, FORMATS } = require('./uploads');
const { estimate, daysBetween } = require('../utils/estimate');
const { rate } = require('../utils/stats');

const router = express.Router();
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Campaign approval tracking: submitted -> admin review -> approved or rejected -> scheduled / running -> completed
function approvalSteps(c) {
  const rejected = c.status === 'Rejected';
  const approved = !['Pending Approval', 'Rejected'].includes(c.status);
  const running = ['Active', 'Paused', 'Completed'].includes(c.status);
  return [
    { key: 'submitted', label: 'Submitted', state: 'done', date: c.submittedAt },
    { key: 'review', label: 'Admin review', state: c.status === 'Pending Approval' ? 'current' : 'done' },
    { key: 'decision', label: rejected ? 'Rejected' : 'Approved', state: rejected ? 'rejected' : approved ? 'done' : 'todo', date: c.decidedAt },
    { key: 'live', label: 'Live', state: rejected ? 'todo' : c.status === 'Completed' ? 'done' : running ? 'current' : 'todo' },
  ];
}

function withDetails(c) {
  const loc = locations.find((l) => l.id === c.location);
  const inv = invoices.find((i) => i.campaignId === c.id);
  const est = estimate({ autos: c.autosBooked, startDate: c.startDate, endDate: c.endDate, startTime: c.startTime, endTime: c.endTime, frequency: c.frequency });
  const { daily, ...rest } = c;
  return {
    ...rest,
    duration: plural(est.days, 'day'),
    locationName: loc ? loc.name : null,
    dailyHours: est.hoursPerDay,
    estimate: est,
    completionRate: rate(c.playback.completed, c.playback.starts),
    invoice: inv ? { number: inv.number, status: inv.status, amount: inv.amount } : null,
    approval: approvalSteps(c),
  };
}

router.get('/', (req, res) => {
  const { status, q } = req.query;
  let list = campaigns.filter((c) => c.ownerId === req.user.id);
  if (status) list = list.filter((c) => c.status.toLowerCase() === String(status).toLowerCase());
  if (q) list = list.filter((c) => c.name.toLowerCase().includes(String(q).toLowerCase()));
  res.json(list.map(withDetails));
});

// Estimated reach shown while the campaign is being set up (scheduled playbacks only, never verified playback)
router.get('/estimate', (req, res) => {
  const autos = Number(req.query.autos);
  const frequency = Number(req.query.frequency);
  const { startDate, endDate, startTime, endTime } = req.query;
  if (!Number.isInteger(autos) || autos < 1 || !Number.isInteger(frequency) || frequency < 1 || !isDate(startDate) || !isDate(endDate) || endDate < startDate || !isTime(startTime) || !isTime(endTime)) {
    return res.status(400).json({ error: 'Fill in the dates, hours, autos and frequency to see the estimate.' });
  }
  res.json(estimate({ autos, startDate, endDate, startTime, endTime, frequency }));
});

router.get('/:id', (req, res) => {
  const c = campaigns.find((x) => x.id === req.params.id && x.ownerId === req.user.id);
  if (!c) return res.status(404).json({ error: 'Campaign not found.' });
  res.json(withDetails(c));
});

// Submit a campaign for admin approval (no payment is taken at this stage)
router.post('/', (req, res) => {
  const { name, description = '', location, startDate, endDate, startTime, endTime, autos, adDuration, frequency, budget, mediaUrl, mediaName = '' } = req.body || {};
  const cleanName = String(name || '').trim();
  const bad = (msg) => res.status(400).json({ error: msg });

  if (!cleanName) return bad('Enter a campaign name.');
  if (cleanName.length > 80) return bad('Campaign name must be 80 characters or fewer.');
  if (String(description).length > 500) return bad('The description must be 500 characters or fewer.');
  if (!isDate(startDate) || !isDate(endDate)) return bad('Choose a start date and an end date.');
  if (startDate < todayIST()) return bad("The start date can't be in the past.");
  if (endDate < startDate) return bad("The end date can't be before the start date.");
  if (!isTime(startTime) || !isTime(endTime)) return bad('Choose the operating hours.');
  if (startTime === endTime) return bad('The start and end of the operating hours must be different.');

  const avail = availability(location, startDate, endDate);
  if (!avail) return bad('Choose a target location.');
  const count = Number(autos);
  if (!Number.isInteger(count) || count < 1) return bad('Choose how many autos to book.');
  if (count > avail.available) {
    return bad(avail.available === 0 ? `No autos are available in ${avail.name} for those dates.` : `Only ${avail.available} autos are available in ${avail.name} for those dates.`);
  }

  const secs = Number(adDuration);
  if (!Number.isInteger(secs) || secs < 5 || secs > 60) return bad('Advertisement duration must be between 5 and 60 seconds.');
  const freq = Number(frequency);
  if (!Number.isInteger(freq) || freq < 1 || freq > 60) return bad('Playback frequency must be between 1 and 60 plays per hour.');
  const money = Number(budget);
  if (!Number.isInteger(money) || money < 1) return bad('Enter a campaign budget in whole rupees.');
  if (money > 100000000) return bad('The campaign budget is too large.');

  const m = /^\/uploads\/([a-f0-9-]{36}\.(\w+))$/.exec(String(mediaUrl || ''));
  const format = m && FORMATS[m[2]];
  if (!format || !fs.existsSync(path.join(UPLOAD_DIR, m[1]))) return bad('Upload an image or video for your campaign.');

  const campaign = {
    id: newId('c'),
    ownerId: req.user.id,
    name: cleanName,
    description: String(description).trim(),
    location: avail.location,
    autosBooked: count,
    adDuration: secs,
    frequency: freq,
    budget: money,
    status: 'Pending Approval',
    startDate,
    endDate,
    startTime,
    endTime,
    media: { url: mediaUrl, type: format.type, name: String(mediaName).slice(0, 120) },
    rejectionReason: '',
    submittedAt: todayIST(),
    decidedAt: null,
    playback: { starts: 0, completed: 0, interrupted: 0, runningHours: 0, activeDevices: 0 },
    daily: {},
  };
  campaigns.unshift(campaign);
  res.status(201).json(withDetails(campaign));
});

module.exports = router;
module.exports.withDetails = withDetails;
module.exports.daysBetween = daysBetween;
