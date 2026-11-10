const express = require('express');
const supabase = require('../config/supabase');
const { findUserByEmail } = require('../data/store');

const router = express.Router();

const profile = (u) => ({
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  company: u.company,
  address: u.address
});

const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const publicVerification = (v = {}) => ({
  status: v.status,
  legalName: v.legalName,
  gstin: v.gstin,
  pan: v.pan,
  documentName: v.document?.name || '',
  submittedAt: v.submittedAt,
  note: v.note
});

// Get advertiser profile
router.get('/profile', (req, res) => {
  res.json(profile(req.user));
});

// Update advertiser profile
router.put('/profile', async (req, res) => {
  try {
    const {
      name,
      email,
      phone = '',
      company = '',
      address = ''
    } = req.body || {};

    if (!String(name || '').trim()) {
      return res.status(400).json({ error: 'Enter your name.' });
    }

    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        error: 'Enter a valid email address.'
      });
    }

    const taken = await findUserByEmail(cleanEmail);

    if (taken && taken.id !== req.user.id) {
      return res.status(409).json({
        error: 'Another account already uses this email.'
      });
    }

    const updates = {
      name: String(name).trim().slice(0, 80),
      email: cleanEmail,
      phone: String(phone).trim().slice(0, 30),
      company: String(company).trim().slice(0, 80),
      address: String(address).trim().slice(0, 200)
    };

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    req.user = data;

    res.json(profile(data));
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({
      error: 'Unable to update profile.'
    });
  }
});

// Get advertiser verification status
router.get('/verification', (req, res) => {
  res.json(publicVerification(req.user.verification));
});

// Submit KYC verification
router.put('/verification', async (req, res) => {
  try {
    const v = req.user.verification || {};

    if (v.status === 'under_review') {
      return res.status(409).json({
        error: 'Your details are already under review.'
      });
    }

    if (v.status === 'verified') {
      return res.status(409).json({
        error: 'Your business is already verified.'
      });
    }

    const legalName = String(req.body?.legalName || '').trim();
    const pan = String(req.body?.pan || '').trim().toUpperCase();
    const gstin = String(req.body?.gstin || '').trim().toUpperCase();
    const documentId = String(req.body?.documentId || '');

    const bad = (msg) => res.status(400).json({ error: msg });

    if (!legalName) {
      return bad('Enter the registered business name.');
    }

    if (!PAN.test(pan)) {
      return bad('Enter a valid PAN, for example ABCDE1234F.');
    }

    if (gstin && !GSTIN.test(gstin)) {
      return bad('Enter a valid 15-character GSTIN, or leave it blank.');
    }

    // The uploaded document must belong to the logged-in user.
    const prefix = `${req.user.id}/`;

    if (!documentId.startsWith(prefix)) {
      return bad('Upload a business registration or GST document.');
    }

    const filename = documentId.slice(prefix.length);

    if (!/^[a-f0-9-]{36}\.(pdf|jpg|jpeg|png)$/i.test(filename)) {
      return bad('Upload a valid PDF, JPG or PNG document.');
    }

    // Confirm that the document exists in the private KYC bucket.
    const { data: files, error: storageError } = await supabase
      .storage
      .from('kyc-documents')
      .list(req.user.id, { search: filename });

    if (storageError) throw storageError;

    const documentExists = (files || []).some(
      file => file.name === filename
    );

    if (!documentExists) {
      return bad('Upload a business registration or GST document.');
    }

    const verification = {
      status: 'under_review',
      legalName: legalName.slice(0, 120),
      gstin,
      pan,
      document: {
        id: documentId,
        name: String(req.body?.documentName || '').slice(0, 120)
      },
      submittedAt: new Date().toISOString().slice(0, 10),
      note: ''
    };

    const { data, error } = await supabase
      .from('users')
      .update({ verification })
      .eq('id', req.user.id)
      .select('verification')
      .single();

    if (error) throw error;

    req.user.verification = data.verification;

    res.json(publicVerification(data.verification));

  } catch (error) {
    console.error('KYC submission error:', error.message);
    res.status(500).json({
      error: 'Unable to submit verification details.'
    });
  }
});

module.exports = router;
