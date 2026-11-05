const express = require('express');
const { findUserByEmail } = require('../data/store');
const { KYC_DIR } = require('./uploads');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const profile = (u) => ({ name: u.name, email: u.email, role: u.role, phone: u.phone, company: u.company, address: u.address });

// ---- Registration / company profile
router.get('/profile', (req, res) => res.json(profile(req.user)));

router.put('/profile', (req, res) => {
  const { name, email, phone = '', company = '', address = '' } = req.body || {};
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) return res.status(400).json({ error: 'Enter a valid email address.' });
  const taken = findUserByEmail(email);
  if (taken && taken.id !== req.user.id) return res.status(409).json({ error: 'Another account already uses this email.' });
  const u = req.user;
  u.name = String(name).trim().slice(0, 80);
  u.email = String(email).trim();
  u.phone = String(phone).trim().slice(0, 30);
  u.company = String(company).trim().slice(0, 80);
  u.address = String(address).trim().slice(0, 200);
  res.json(profile(u));
});

// ---- Advertiser verification (KYC). An admin reviews the submission.
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// Never send the stored document id back: KYC documents are not downloadable from the advertiser app
const publicVerification = (v) => ({ status: v.status, legalName: v.legalName, gstin: v.gstin, pan: v.pan, documentName: v.document?.name || '', submittedAt: v.submittedAt, note: v.note });

router.get('/verification', (req, res) => res.json(publicVerification(req.user.verification)));

router.put('/verification', (req, res) => {
  const v = req.user.verification;
  if (v.status === 'under_review') return res.status(409).json({ error: 'Your details are already under review.' });
  if (v.status === 'verified') return res.status(409).json({ error: 'Your business is already verified.' });

  const legalName = String(req.body?.legalName || '').trim();
  const pan = String(req.body?.pan || '').trim().toUpperCase();
  const gstin = String(req.body?.gstin || '').trim().toUpperCase();
  const documentId = String(req.body?.documentId || '');
  const bad = (msg) => res.status(400).json({ error: msg });

  if (!legalName) return bad('Enter the registered business name.');
  if (!PAN.test(pan)) return bad('Enter a valid PAN, for example ABCDE1234F.');
  if (gstin && !GSTIN.test(gstin)) return bad('Enter a valid 15-character GSTIN, or leave it blank.');
  if (!/^[a-f0-9-]{36}\.\w+$/.test(documentId) || !fs.existsSync(path.join(KYC_DIR, documentId))) return bad('Upload a business registration or GST document.');

  req.user.verification = { status: 'under_review', legalName: legalName.slice(0, 120), gstin, pan, document: { id: documentId, name: String(req.body?.documentName || '').slice(0, 120) }, submittedAt: new Date().toISOString().slice(0, 10), note: '' };
  res.json(publicVerification(req.user.verification));
});

module.exports = router;
