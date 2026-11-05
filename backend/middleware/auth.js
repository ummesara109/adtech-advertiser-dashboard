const { randomUUID } = require('crypto');
const { users } = require('../data/store');

const sessions = new Map(); // token -> user id

function createSession(userId) {
  const token = randomUUID();
  sessions.set(token, userId);
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function tokenFrom(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Puts the logged-in client on req.user so every route only touches that client's data
function requireAuth(req, res, next) {
  const token = tokenFrom(req);
  const user = token && users.find((u) => u.id === sessions.get(token));
  if (!user) return res.status(401).json({ error: 'Please log in to continue.' });
  req.token = token;
  req.user = user;
  next();
}

module.exports = { createSession, destroySession, requireAuth, tokenFrom };
