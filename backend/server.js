const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('./middleware/auth');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));

// Uploaded creatives are served publicly so <img>/<video> tags can load them (file names are random UUIDs)
app.use('/uploads', express.static(require('./routes/uploads').UPLOAD_DIR));

// Everything below needs a valid login token
app.use('/api', requireAuth);
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api', require('./routes/account')); // company profile and advertiser verification

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// Serve the built frontend (run `npm run build` first) so one server hosts everything
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  if (err.status === 413) return res.status(413).json({ error: 'That file is too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => console.log(`AdTech API running on http://localhost:${PORT}`));
