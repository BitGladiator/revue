require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { execSync } = require('child_process');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { reviewQueue } = require('./queues/index');

const { securityHeaders, compress } = require('./middleware/security');
const { globalLimiter, authLimiter, webhookLimiter,
        reReviewLimiter, speedLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const requestMetrics = require('./middleware/requestMetrics');
const { register, activeWebSocketConnections } = require('./observability/metrics');
const logger = require('./observability/logger');
require('./queues/workers/reviewWorker');

const authRoutes      = require('./routes/auth');
const repoRoutes      = require('./routes/repos');
const webhookRoutes   = require('./routes/webhooks');
const reviewRoutes    = require('./routes/reviews');
const settingsRoutes  = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const httpServer = createServer(app);


try {
  console.log('Running migrations...');
  execSync('npm run migrate:up', { cwd: __dirname, stdio: 'inherit' });
  console.log('Migrations complete');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
}

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean);

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
  transports: ['websocket'],
  pingTimeout: 20000,
  pingInterval: 25000,
});

module.exports.io = io;


app.use(securityHeaders);


app.use(compress);

app.use(requestMetrics);
app.use(requestLogger);


app.use(globalLimiter);


app.use(speedLimiter);


app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());


const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({ queues: [new BullMQAdapter(reviewQueue)], serverAdapter });
app.use('/admin/queues', serverAdapter.getRouter());


app.use('/api/webhooks', webhookLimiter, express.raw({ type: 'application/json' }), webhookRoutes);


app.use(express.json({ limit: '10kb' }));



app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/repos',     repoRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/analytics', analyticsRoutes);


app.use('/api/reviews',   reviewRoutes);


io.on('connection', (socket) => {
  activeWebSocketConnections.inc();

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    logger.info('User joined WebSocket room', { userId });
  });

  socket.on('disconnect', () => {
    activeWebSocketConnections.dec();
  });
});

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  uptime: Math.round(process.uptime()),
  memory: {
    heapUsed:  Math.round(process.memoryUsage().heapUsed  / 1024 / 1024) + 'MB',
    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
  },
  timestamp: new Date().toISOString(),
}));



app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
  });
});

const PORT = process.env.PORT || 5500;
httpServer.listen(PORT, () => console.log(`Revue running on port ${PORT}`));