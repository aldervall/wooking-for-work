import crypto from 'crypto';
import express from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import jobsRouter from './api/jobs.js';
import activitiesRouter from './api/activities.js';
import runsRouter from './api/runs.js';
import staticRouter from './api/static.js';
import profileRouter from './api/profile.js';
import scrapeRouter from './api/scrape.js';
import authRouter from './api/auth.js';
import { requireAuth, optionalUser } from './middleware/auth.js';

const SQLiteStore = connectSqlite3(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const PORT = parseInt(process.env.PORT, 10) || 3002;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.resolve(__dirname, '../data') }),
  secret: process.env.SESSION_SECRET || crypto.randomUUID(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use(optionalUser);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRouter);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return requireAuth(req, res, next);
  }
  next();
});

app.use('/api/jobs', jobsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/runs', runsRouter);
app.use('/api', staticRouter);
app.use('/api/profile', profileRouter);
app.use('/api/scrape', scrapeRouter);

// Serve static files from public directory
app.use(express.static(PUBLIC_DIR));

// SPA fallback - serve index.html for all non-API routes
app.use((req, res, next) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
    return;
  }
  
  // Serve index.html for all other routes (SPA fallback)
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    code: err.code,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\nWooking for Work server started successfully!`);
  console.log(`  Local:    http://localhost:${PORT}`);
  console.log(`  Frontend: http://localhost:${PORT}/`);
  console.log(`  Health:   http://localhost:${PORT}/health`);
  console.log(`  API:      http://localhost:${PORT}/api/jobs`);
  console.log(`\nDatabase: /opt/wooking-for-work/data/wooking.db`);
  console.log(`\nPress Ctrl+C to stop the server.\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
