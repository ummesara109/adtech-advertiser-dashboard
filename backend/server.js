const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const supabase = require('./config/supabase');
const { requireAuth } = require('./middleware/auth');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'AdTech Advertiser Dashboard Backend is running!',
    status: 'ok'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Temporary Supabase connection test
app.get('/api/health/db', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    res.json({
      status: 'connected',
      database: 'Supabase',
      totalUsers: count
    });
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// Protect all remaining API routes
app.use('/api', requireAuth);

// Protected routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api', require('./routes/account'));

// API not found
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found.'
  });
});

// Optional local frontend serving
const dist = path.join(__dirname, '..', 'frontend', 'dist');

if (fs.existsSync(dist)) {
  app.use(express.static(dist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  if (err.status === 413) {
    return res.status(413).json({
      error: 'That file is too large.'
    });
  }

  console.error(err);

  res.status(500).json({
    error: 'Something went wrong on the server.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AdTech API running on port ${PORT}`);
  });
}

module.exports = app;