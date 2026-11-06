require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const { connectDB, isDbConnected } = require('./config/db');
const { getSecret } = require('./utils/auth');
const seedUsers = require('./utils/seedUsers');
const { blockOperatorInjection } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(express.json({ limit: '100kb' }));
app.use(blockOperatorInjection);

// ── Routes ────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const connected = isDbConnected();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    message: 'Escrow Platform Backend Running',
    database: connected ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/wallets', require('./routes/walletRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/escrow', require('./routes/escrowRoutes'));
app.use('/api/dispute', require('./routes/disputeRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use('/api', notFound);
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    getSecret(); // fail fast if JWT_SECRET is missing in production
    if (!process.env.JWT_SECRET) {
      console.warn('Warning: JWT_SECRET is not set — using an insecure development secret.');
    }

    await connectDB();
    await seedUsers();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) startServer();

module.exports = app;
