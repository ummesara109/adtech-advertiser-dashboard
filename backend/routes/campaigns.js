const express = require('express');
const { randomUUID } = require('crypto');
const supabase = require('../config/supabase');
const { availability, todayIST, isDate, isTime } = require('../utils/availability');
const { FORMATS } = require('./uploads');
const { estimate, daysBetween } = require('../utils/estimate');
const { rate } = require('../utils/stats');

const router = express.Router();

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

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

// Convert Supabase database fields to the frontend's camelCase format
function mapCampaign(c) {
  return {
    id: c.id,
    ownerId: c.owner_id,
    name: c.name,
    description: c.description || '',
    location: c.location,
    autosBooked: c.autos_booked,
    adDuration: c.ad_duration,
    frequency: c.frequency,
    budget: Number(c.budget),
    status: c.status,
    startDate: c.start_date,
    endDate: c.end_date,
    startTime: c.start_time,
    endTime: c.end_time,
    media: c.media,
    rejectionReason: c.rejection_reason || '',
    submittedAt: c.submitted_at,
    decidedAt: c.decided_at,
    playback: c.playback || {},
    daily: c.daily || {}
  };
}

function withDetails(c, allCampaigns = [], invoices = [], locations = []) {
  const campaign = c.owner_id !== undefined ? mapCampaign(c) : c;

  const loc = locations.find(l => l.id === campaign.location);
  const inv = invoices.find(i =>
    (i.campaign_id || i.campaignId) === campaign.id
  );

  const est = estimate({
    autos: campaign.autosBooked,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    startTime: campaign.startTime,
    endTime: campaign.endTime,
    frequency: campaign.frequency
  });

  const { daily, ...rest } = campaign;

  return {
    ...rest,
    duration: plural(est.days, 'day'),
    locationName: loc ? loc.name : null,
    dailyHours: est.hoursPerDay,
    estimate: est,
    completionRate: rate(
      campaign.playback?.completed || 0,
      campaign.playback?.starts || 0
    ),
    invoice: inv ? {
      number: inv.number,
      status: inv.status,
      amount: Number(inv.amount)
    } : null,
    approval: approvalSteps(campaign)
  };
}

// Get advertiser campaigns
router.get('/', async (req, res) => {
  try {
    const { status, q } = req.query;

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let list = data || [];

    if (status) {
      list = list.filter(c =>
        c.status.toLowerCase() === String(status).toLowerCase()
      );
    }

    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(String(q).toLowerCase())
      );
    }

    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('owner_id', req.user.id);

    if (invoiceError) throw invoiceError;

    const { data: locations, error: locationError } = await supabase
      .from('locations')
      .select('*');

    if (locationError) throw locationError;

    res.json(list.map(c =>
      withDetails(c, data, invoices || [], locations || [])
    ));
  } catch (error) {
    console.error('Campaign list error:', error.message);
    res.status(500).json({ error: 'Unable to load campaigns.' });
  }
});

// Campaign estimate
router.get('/estimate', (req, res) => {
  const autos = Number(req.query.autos);
  const frequency = Number(req.query.frequency);
  const { startDate, endDate, startTime, endTime } = req.query;

  if (
    !Number.isInteger(autos) || autos < 1 ||
    !Number.isInteger(frequency) || frequency < 1 ||
    !isDate(startDate) || !isDate(endDate) ||
    endDate < startDate ||
    !isTime(startTime) || !isTime(endTime)
  ) {
    return res.status(400).json({
      error: 'Fill in the dates, hours, autos and frequency to see the estimate.'
    });
  }

  res.json(estimate({
    autos,
    startDate,
    endDate,
    startTime,
    endTime,
    frequency
  }));
});

// Get one campaign
router.get('/:id', async (req, res) => {
  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const [{ data: invoices, error: invoiceError }, { data: locations, error: locationError }] =
      await Promise.all([
        supabase.from('invoices').select('*').eq('owner_id', req.user.id),
        supabase.from('locations').select('*')
      ]);

    if (invoiceError) throw invoiceError;
    if (locationError) throw locationError;

    res.json(withDetails(campaign, [campaign], invoices || [], locations || []));
  } catch (error) {
    console.error('Campaign details error:', error.message);
    res.status(500).json({ error: 'Unable to load campaign.' });
  }
});

// Submit a campaign for admin approval
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description = '',
      location,
      startDate,
      endDate,
      startTime,
      endTime,
      autos,
      adDuration,
      frequency,
      budget,
      mediaUrl,
      mediaName = ''
    } = req.body || {};

    const cleanName = String(name || '').trim();
    const bad = msg => res.status(400).json({ error: msg });

    if (!cleanName) return bad('Enter a campaign name.');
    if (cleanName.length > 80) return bad('Campaign name must be 80 characters or fewer.');
    if (String(description).length > 500) return bad('The description must be 500 characters or fewer.');
    if (!isDate(startDate) || !isDate(endDate)) return bad('Choose a start date and an end date.');
    if (startDate < todayIST()) return bad("The start date can't be in the past.");
    if (endDate < startDate) return bad("The end date can't be before the start date.");
    if (!isTime(startTime) || !isTime(endTime)) return bad('Choose the operating hours.');
    if (startTime === endTime) return bad('The start and end of the operating hours must be different.');

    const avail = await availability(location, startDate, endDate);
    if (!avail) return bad('Choose a target location.');

    const count = Number(autos);

    if (!Number.isInteger(count) || count < 1) {
      return bad('Choose how many autos to book.');
    }

    if (count > avail.available) {
      return bad(
        avail.available === 0
          ? `No autos are available in ${avail.name} for those dates.`
          : `Only ${avail.available} autos are available in ${avail.name} for those dates.`
      );
    }

    const secs = Number(adDuration);
    if (!Number.isInteger(secs) || secs < 5 || secs > 60) {
      return bad('Advertisement duration must be between 5 and 60 seconds.');
    }

    const freq = Number(frequency);
    if (!Number.isInteger(freq) || freq < 1 || freq > 60) {
      return bad('Playback frequency must be between 1 and 60 plays per hour.');
    }

    const money = Number(budget);
    if (!Number.isInteger(money) || money < 1) {
      return bad('Enter a campaign budget in whole rupees.');
    }

    if (money > 100000000) {
      return bad('The campaign budget is too large.');
    }

    // Verify that the uploaded creative belongs to this advertiser
    const publicPrefix = supabase.storage
      .from('campaign-creatives')
      .getPublicUrl('')
      .data.publicUrl;

    const expectedPrefix = publicPrefix.replace(/\/$/, '') + '/';

    if (
      typeof mediaUrl !== 'string' ||
      !mediaUrl.startsWith(expectedPrefix)
    ) {
      return bad('Upload an image or video for your campaign.');
    }

    let storagePath;

    try {
      storagePath = decodeURIComponent(mediaUrl.split('/campaign-creatives/')[1].split('?')[0]);
    } catch {
      return bad('Upload an image or video for your campaign.');
    }

    if (!storagePath.startsWith(`${req.user.id}/`)) {
      return bad('Invalid campaign creative.');
    }

    const filename = storagePath.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();
    const format = FORMATS[ext];

    if (!format) {
      return bad('Upload an image or video for your campaign.');
    }

    const { data: files, error: fileError } = await supabase.storage
      .from('campaign-creatives')
      .list(req.user.id, { search: filename });

    if (fileError) throw fileError;

    if (!(files || []).some(file => file.name === filename)) {
      return bad('Upload an image or video for your campaign.');
    }

    const campaign = {
      id: `c${randomUUID().replace(/-/g, '').slice(0, 8)}`,
      owner_id: req.user.id,
      name: cleanName,
      description: String(description).trim(),
      location: avail.location,
      autos_booked: count,
      ad_duration: secs,
      frequency: freq,
      budget: money,
      status: 'Pending Approval',
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      media: {
        url: mediaUrl,
        path: storagePath,
        type: format.type,
        name: String(mediaName).slice(0, 120)
      },
      rejection_reason: '',
      submitted_at: todayIST(),
      decided_at: null,
      playback: {
        starts: 0,
        completed: 0,
        interrupted: 0,
        runningHours: 0,
        activeDevices: 0
      },
      daily: {}
    };

    const { data: saved, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) throw error;

    const { data: locations, error: locationError } = await supabase
      .from('locations')
      .select('*');

    if (locationError) throw locationError;

    return res.status(201).json(
      withDetails(saved, [saved], [], locations || [])
    );
  } catch (error) {
    console.error('Campaign creation error:', error.message);
    res.status(500).json({ error: 'Unable to create campaign. Please try again.' });
  }
});

module.exports = router;
module.exports.withDetails = withDetails;
module.exports.daysBetween = daysBetween;
