const { randomUUID } = require('crypto');
const supabase = require('../config/supabase');

const SESSION_DAYS = 7;

async function createSession(userId) {
  const token = randomUUID();

  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from('sessions')
    .insert({
      token,
      user_id: userId,
      expires_at: expiresAt
    });

  if (error) throw error;

  return token;
}

async function destroySession(token) {
  if (!token) return;

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('token', token);

  if (error) throw error;
}

function tokenFrom(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ')
    ? header.slice(7)
    : null;
}

async function requireAuth(req, res, next) {
  try {
    const token = tokenFrom(req);

    if (!token) {
      return res.status(401).json({
        error: 'Please log in to continue.'
      });
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;

    if (!session || new Date(session.expires_at) <= new Date()) {
      return res.status(401).json({
        error: 'Please log in to continue.'
      });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .maybeSingle();

    if (userError) throw userError;

    if (!user) {
      return res.status(401).json({
        error: 'Please log in to continue.'
      });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(500).json({
      error: 'Authentication failed. Please try again.'
    });
  }
}

module.exports = {
  createSession,
  destroySession,
  requireAuth,
  tokenFrom
};
