import { Router } from 'express';
import { startScrape, getActiveRun, onLog } from '../services/scraper.js';
import { v4 as uuid } from 'uuid';
import { getAll } from '../database/db.js';

const router = Router();

const CLIENTS = new Map();

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  sendSSE(res, 'connected', { message: 'SSE connected' });

  const clientId = uuid();
  CLIENTS.set(clientId, res);

  const unsubLog = onLog((runId, entry) => {
    sendSSE(res, 'log', { runId, entry });
  });

  const active = getActiveRun();
  if (active) {
    sendSSE(res, 'active', active);
  }

  const keepAlive = setInterval(() => {
    sendSSE(res, 'ping', { t: Date.now() });
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubLog();
    CLIENTS.delete(clientId);
  });
});

router.post('/start', async (req, res) => {
  const active = getActiveRun();
  if (active) {
    return res.status(409).json({ error: 'A scrape is already running', active });
  }

  const { keywords, municipality, remote } = req.body;
  const runId = uuid();
  res.json({ runId, status: 'started' });

  process.nextTick(() => {
    startScrape(runId, { keywords, municipality, remote, userId: req.currentUser.id }).catch(err => {
      console.error('Scrape error:', err);
      for (const [, client] of CLIENTS) {
        sendSSE(client, 'error', { message: err.message });
      }
    });
  });
});

router.get('/status', (req, res) => {
  const active = getActiveRun();
  res.json({ active });
});

router.get('/logs', (req, res) => {
  const runs = getAll('SELECT id, status, started_at, completed_at, steps FROM runs WHERE job_id = ? ORDER BY created_at DESC LIMIT 20', ['scrape-session']);
  res.json({ runs });
});

export default router;
