require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { execSync } = require('child_process');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { reviewQueue } = require('./queues/index');
const settingsRoutes  = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');

require('./queues/workers/reviewWorker');

const authRoutes    = require('./routes/auth');
const repoRoutes    = require('./routes/repos');
const webhookRoutes = require('./routes/webhooks');
const reviewRoutes  = require('./routes/reviews');

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
});


module.exports.io = io;

app.use(helmet());
app.use(compression());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());


const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({ queues: [new BullMQAdapter(reviewQueue)], serverAdapter });
app.use('/admin/queues', serverAdapter.getRouter());


app.use('/api/webhooks', webhookRoutes);
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth',    authRoutes);
app.use('/api/repos',   repoRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} connected to WebSocket`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  uptime: Math.round(process.uptime()),
  timestamp: new Date().toISOString(),
}));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 5500;
httpServer.listen(PORT, () => console.log(`Revue server running on port ${PORT}`));