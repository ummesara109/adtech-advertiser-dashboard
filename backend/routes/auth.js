const express = require('express');
const supabase = require('../config/supabase');
const {
  createSession,
  destroySession,
  tokenFrom
} = require('../middleware/auth');
const {
  hashPassword,
  verifyPassword
} = require('../utils/passwords');

const router = express.Router();

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const failures = new Map();
const WINDOW = 15 * 60 * 1000;

function tooMany(email) {
  const entry = failures.get(email);
  if (!entry) return false;

  if (Date.now() - entry.first > WINDOW) {
    failures.delete(email);
    return false;
  }

  return entry.count >= 5;
}

function fail(email) {
  const entry = failures.get(email);

  if (!entry || Date.now() - entry.first > WINDOW) {
    failures.set(email, { first: Date.now(), count: 1 });
  } else {
    entry.count++;
  }
}

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '');
    const company = String(req.body.company || '');

    if (!name || !EMAIL.test(email) || password.length < 8) {
      return res.status(400).json({
        error: 'Enter a valid name, email and password of at least 8 characters.'
      });
    }

    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (findError) throw findError;

    // Temporary diagnostic response
    if (existing) {
      console.log('Registration duplicate detected:', existing.email);

      return res.status(409).json({
        error: 'Email lookup found an existing user.',
        diagnostic: 'USER_FOUND'
      });
    }

    console.log('Registration email lookup: no existing user found.');

    const user = {
      id: require('crypto').randomUUID(),
      name,
      email,
      password_hash: hashPassword(password),
      role: 'Advertiser',
      phone,
      company,
      address: '',
      verification: {
        status: 'not_submitted',
        legalName: '',
        gstin: '',
        pan: '',
        document: null,
        submittedAt: null,
        note: ''
      }
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(user);

    if (insertError) throw insertError;

    const token = await createSession(user.id);

    return res.status(201).json({
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      error: 'Registration failed. Please try again.'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!EMAIL.test(email) || !password) {
      return res.status(400).json({
        error: 'Enter a valid email and password.'
      });
    }

    if (tooMany(email)) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again later.'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!user || !verifyPassword(password, user.password_hash)) {
      fail(email);
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    failures.delete(email);

    const token = await createSession(user.id);

    return res.json({
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      error: 'Login failed. Please try again.'
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = tokenFrom(req);

    if (token) await destroySession(token);

    return res.json({ ok: true });
  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(500).json({
      error: 'Logout failed. Please try again.'
    });
  }
});

module.exports = router;
