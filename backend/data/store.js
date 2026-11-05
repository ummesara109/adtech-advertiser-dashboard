// In-memory demo data store. Restarting the server resets everything.
// Swap this file for Supabase PostgreSQL (as in the architecture doc) when you are ready.
const { randomUUID } = require('crypto');
const { hashPassword } = require('./../utils/passwords');
const { todayIST, addDays } = require('../utils/dates');

const users = [];
const normEmail = (e) => String(e || '').trim().toLowerCase();
const findUserByEmail = (email) => users.find((u) => u.email.toLowerCase() === normEmail(email));

function createUser({ name, email, password, phone = '', company = '' }) {
  const user = {
    id: `u${users.length + 1}`,
    name: String(name).trim(),
    email: String(email).trim(),
    passwordHash: hashPassword(password),
    role: 'Advertiser',
    phone,
    company,
    address: '',
    // Advertiser verification / KYC (an admin reviews it): not_submitted | under_review | verified | rejected
    verification: { status: 'not_submitted', legalName: '', gstin: '', pan: '', document: null, submittedAt: null, note: '' },
  };
  users.push(user);
  return user;
}

createUser({ name: 'Rekha Patil', email: 'rekha@example.com', password: 'password123', company: 'Rekha Motors' });
users[0].verification = { status: 'verified', legalName: 'Rekha Motors Pvt Ltd', gstin: '', pan: '', document: null, submittedAt: '2026-10-01', note: '' };

// Sample auto counts per area (Bengaluru). Replace with real vehicle/device data.
const locations = [
  { id: 'koramangala', name: 'Koramangala', totalAutos: 40 },
  { id: 'indiranagar', name: 'Indiranagar', totalAutos: 35 },
  { id: 'whitefield', name: 'Whitefield', totalAutos: 30 },
  { id: 'jayanagar', name: 'Jayanagar', totalAutos: 28 },
  { id: 'mg-road', name: 'MG Road', totalAutos: 25 },
  { id: 'electronic-city', name: 'Electronic City', totalAutos: 32 },
  { id: 'malleshwaram', name: 'Malleshwaram', totalAutos: 22 },
  { id: 'yelahanka', name: 'Yelahanka', totalAutos: 20 },
];

const today = todayIST();

// Sample campaigns, dated relative to today so the demo always looks current.
// `playback` holds device-reported playback events that the backend has validated (sample numbers).
const base = {
  ownerId: 'u1', description: '', adDuration: 15, frequency: 6, media: null, rejectionReason: '',
};
const campaigns = [
  { ...base, id: 'c1', name: 'Car Launch Campaign', description: 'Showroom launch weekend offers', location: 'koramangala', autosBooked: 10, budget: 60000, status: 'Active', startDate: addDays(today, -35), endDate: addDays(today, 56), startTime: '06:00', endTime: '22:00', submittedAt: addDays(today, -40), decidedAt: addDays(today, -37), playback: { starts: 42180, completed: 40750, interrupted: 1430, runningHours: 5120, activeDevices: 9 } },
  { ...base, id: 'c2', name: 'Fashion Sale', description: 'Festival season sale', location: 'indiranagar', autosBooked: 5, budget: 25000, adDuration: 10, frequency: 4, status: 'Scheduled', startDate: addDays(today, 10), endDate: addDays(today, 40), startTime: '09:00', endTime: '21:00', submittedAt: addDays(today, -6), decidedAt: addDays(today, -4), playback: { starts: 0, completed: 0, interrupted: 0, runningHours: 0, activeDevices: 0 } },
  { ...base, id: 'c3', name: 'Electronics Offer', description: 'Year-end electronics discounts', location: 'jayanagar', autosBooked: 4, budget: 12500, adDuration: 30, frequency: 3, status: 'Completed', startDate: addDays(today, -66), endDate: addDays(today, -36), startTime: '09:00', endTime: '21:00', submittedAt: addDays(today, -72), decidedAt: addDays(today, -70), playback: { starts: 12400, completed: 11960, interrupted: 440, runningHours: 1480, activeDevices: 0 } },
  { ...base, id: 'c4', name: 'Grand Opening Offer', description: 'New store opening in Whitefield', location: 'whitefield', autosBooked: 6, budget: 30000, status: 'Pending Approval', startDate: addDays(today, 14), endDate: addDays(today, 28), startTime: '08:00', endTime: '20:00', submittedAt: addDays(today, -1), decidedAt: null, playback: { starts: 0, completed: 0, interrupted: 0, runningHours: 0, activeDevices: 0 } },
  { ...base, id: 'c5', name: 'Clearance Banner', description: '', location: 'mg-road', autosBooked: 3, budget: 9000, status: 'Rejected', rejectionReason: 'The creative is unreadable at the required size. Please upload a higher resolution file.', startDate: addDays(today, 5), endDate: addDays(today, 12), startTime: '10:00', endTime: '18:00', submittedAt: addDays(today, -8), decidedAt: addDays(today, -7), playback: { starts: 0, completed: 0, interrupted: 0, runningHours: 0, activeDevices: 0 } },
];

// Daily playback records for the sample campaigns: the totals above spread over the days each campaign has run.
function seedDaily(c) {
  const last = c.endDate < today ? c.endDate : today;
  const days = [];
  for (let d = c.startDate; d <= last; d = addDays(d, 1)) days.push(d);
  const weights = days.map((_, i) => 1 + 0.25 * Math.sin(i * 1.3) + (i / days.length) * 0.3);
  const total = weights.reduce((s, w) => s + w, 0);
  const out = {};
  let rs = 0; let rc = 0; let ri = 0;
  days.forEach((d, i) => {
    const isLast = i === days.length - 1;
    const starts = isLast ? c.playback.starts - rs : Math.round((c.playback.starts * weights[i]) / total);
    const completed = isLast ? c.playback.completed - rc : Math.round((c.playback.completed * weights[i]) / total);
    const interrupted = isLast ? c.playback.interrupted - ri : Math.round((c.playback.interrupted * weights[i]) / total);
    rs += starts; rc += completed; ri += interrupted;
    out[d] = { starts, completed, interrupted };
  });
  return out;
}
campaigns.forEach((c) => { c.daily = c.playback.starts ? seedDaily(c) : {}; });

// Invoices are issued by the platform after a campaign is approved; payments are tracked against them.
const invoices = [
  { id: 'i1', ownerId: 'u1', number: 'INV-2026-0001', issuedAt: addDays(today, -37), campaignId: 'c1', description: 'Car Launch Campaign', amount: 60000, status: 'Paid', paidAt: addDays(today, -35), reference: 'TXN-DEMO0001' },
  { id: 'i2', ownerId: 'u1', number: 'INV-2026-0002', issuedAt: addDays(today, -70), campaignId: 'c3', description: 'Electronics Offer', amount: 12500, status: 'Paid', paidAt: addDays(today, -66), reference: 'TXN-DEMO0002' },
  { id: 'i3', ownerId: 'u1', number: 'INV-2026-0003', issuedAt: addDays(today, -4), campaignId: 'c2', description: 'Fashion Sale', amount: 25000, status: 'Pending', paidAt: null, reference: '' },
];

const newId = (prefix) => `${prefix}${randomUUID().slice(0, 8)}`;

module.exports = { users, locations, campaigns, invoices, newId, createUser, findUserByEmail, normEmail };
