const express = require('express');
const { users, createUser, findUserByEmail, normEmail } = require('../data/store');
const { createSession, destroySession, tokenFrom } = require('../middleware/auth');
const { verifyPassword } = require('../utils/passwords');

const router = express.Router();

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Slow down password guessing: 10 failed logins per email in 15 minutes
const failures = new Map(); // email -> { count, first }
const WINDOW = 15 * 60 * 1000;
const tooMany = (email) => {
  const f = failures.get(email);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW) return failures.delete(email), false;
  return f.count >= 10;
};
const fail = (email) => {
  const f = failures.get(email);
  if (!f || Date.now() - f.first > WINDOW) failures.set(email, { count: 1, first: Date.now() });
  else f.count += 1;
};

router.post('/register', (req, res) => {
  const { name, email, password, company = '', phone = '' } = req.body || {};
  const bad = (msg) => res.status(400).json({ error: msg });
  if (!String(name || '').trim()) return bad('Enter your full name.');
  if (!EMAIL.test(String(email || '').trim())) return bad('Enter a valid email address.');
  if (String(password || '').length < 8) return bad('Choose a password with at least 8 characters.');
  if (findUserByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });

  const user = createUser({ name: String(name).trim().slice(0, 80), email: String(email).trim(), password: String(password), company: String(company).trim().slice(0, 80), phone: String(phone).trim().slice(0, 30) });
  res.status(201).json({ token: createSession(user.id), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Enter your email and password.' });
  const key = normEmail(email);
  if (tooMany(key)) return res.status(429).json({ error: 'Too many failed attempts. Try again in a few minutes.' });

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    fail(key);
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  failures.delete(key);
  res.json({ token: createSession(user.id), user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  const token = tokenFrom(req);
  if (token) destroySession(token);
  res.json({ ok: true });
});

module.exports = router;
