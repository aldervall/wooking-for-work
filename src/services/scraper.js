import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import { runQuery, getAll } from '../database/db.js';
import { getValidToken, searchJobsLi } from './linkedin-api.js';

const AF_SEARCH = 'https://jobsearch.api.jobtechdev.se/search';

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

const ACTIVE_SCRAPES = new Map();

export function onLog(fn) {
  emitter.on('log', fn);
  return () => emitter.off('log', fn);
}

function emit(runId, level, message, data) {
  const entry = { timestamp: new Date().toISOString(), level, message, data };
  emitter.emit('log', runId, entry);
}

export function getActiveRun() {
  for (const [id, state] of ACTIVE_SCRAPES) {
    if (state.status === 'running') return { runId: id, ...state };
  }
  return null;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function startScrape(runId, options = {}) {
  const id = runId || uuid();
  const keywords = options.keywords || ['IT', 'Systemtekniker', 'DevSecOps'];
  const municipality = options.municipality || '';
  const remote = options.remote !== false;
  const userId = options.userId || null;

  ACTIVE_SCRAPES.set(id, { status: 'running', keywords, startedAt: new Date().toISOString() });

  try {

  runQuery(`INSERT INTO runs (id, job_id, status, steps) VALUES (?, 'scrape-session', 'running', ?)`,
    [id, JSON.stringify([{ action: 'started', keywords, timestamp: new Date().toISOString() }])]);

  emit(id, 'info', `Scrape started — keywords: ${keywords.join(', ')}`);

  let totalFound = 0;

  // Phase 1: Arbetsförmedlingen
  emit(id, 'step', 'Searching Arbetsförmedlingen...');
  try {
    const params = new URLSearchParams({
      q: keywords.join(' '),
      limit: '50',
      offset: '0',
    });
    if (municipality) params.set('municipality', municipality);
    if (remote) params.set('remote', 'true');

    emit(id, 'info', `GET ${AF_SEARCH}?${params}`);
    const res = await fetch(`${AF_SEARCH}?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'WookingForWork/1.0' },
    });

    if (!res.ok) {
      emit(id, 'error', `AF API returned ${res.status}: ${res.statusText}`);
    } else {
      const data = await res.json();
      const hits = data.hits || [];
      totalFound += hits.length;
      emit(id, 'success', `AF found ${hits.length} jobs`);

      for (const job of hits.slice(0, 20)) {
        const existing = getAll('SELECT id FROM jobs WHERE src = ? AND ref = ?', ['AF', job.id]);
        if (existing.length === 0) {
          const jobId = uuid();
          const skills = (job.occupation?.label || '').split(',').map(s => s.trim()).filter(Boolean);
          const lang = job.description?.text ? (/[åäö]/i.test(job.description.text) ? 'sv' : 'en') : 'sv';
          const afVals = [
            jobId,
            job.id,
            job.headline || 'Unknown title',
            job.employer?.name || 'Unknown employer',
            job.workplace_address?.municipality || job.workplace_address?.city || 'Unknown',
            job.workplace_address?.distance || null,
            job.remote ? 'true' : 'false',
            Math.floor(Math.random() * 30) + 50,
            job.description?.text?.substring(0, 500) || '',
            JSON.stringify(skills),
            job.webpage_url || job.url || '',
            job.publication_date ? Math.floor((Date.now() - new Date(job.publication_date).getTime()) / 86400000) : 0,
            lang,
          ];
          if (userId) {
            runQuery(`INSERT OR IGNORE INTO jobs
              (id, src, ref, title, employer, location, distance, remote, match, state, excerpt, skills, url, posted_days, language, user_id)
              VALUES (?, 'AF', ?, ?, ?, ?, ?, ?, ?, 'scraped', ?, ?, ?, ?, ?, ?)`,
              [...afVals, userId]);
          } else {
            runQuery(`INSERT OR IGNORE INTO jobs
              (id, src, ref, title, employer, location, distance, remote, match, state, excerpt, skills, url, posted_days, language)
              VALUES (?, 'AF', ?, ?, ?, ?, ?, ?, ?, 'scraped', ?, ?, ?, ?, ?)`,
              afVals);
          }
          emit(id, 'job', `New: ${job.headline} @ ${job.employer?.name}`, { ref: job.id, headline: job.headline, employer: job.employer?.name, src: 'AF', url: job.webpage_url || job.url || '' });
        } else {
          emit(id, 'debug', `Skipped duplicate: ${job.headline}`);
        }
        await sleep(100);
      }
    }
  } catch (err) {
    emit(id, 'error', `AF search error: ${err.message}`);
  }

  // Phase 2: LinkedIn (if OAuthed)
  emit(id, 'step', 'Searching LinkedIn...');
  const liToken = await getValidToken();
  if (liToken) {
    try {
      const liResult = await searchJobsLi(keywords.join(' '), municipality);
      if (liResult.ok) {
        emit(id, 'success', `LinkedIn found ${liResult.jobs.length} jobs`);
        totalFound += liResult.jobs.length;
        for (const job of liResult.jobs.slice(0, 20)) {
          const ref = job.id || job.entityUrn;
          if (!ref) continue;
          const existing = getAll('SELECT id FROM jobs WHERE src = ? AND ref = ?', ['LinkedIn', String(ref)]);
          if (existing.length === 0) {
            const jobId = uuid();
            const liVals = [
              jobId,
              String(ref),
              job.title || 'Unknown',
              job.companyDetails?.name || job.companyName || 'Unknown',
              job.location || 'Unknown',
              job.remote ? 'true' : 'false',
              Math.floor(Math.random() * 30) + 50,
              job.listingUrl || job.url || '',
              job.listedAt ? Math.floor((Date.now() - job.listedAt) / 86400000) : 0,
            ];
            if (userId) {
              runQuery(`INSERT OR IGNORE INTO jobs
                (id, src, ref, title, employer, location, remote, state, match, url, posted_days, user_id)
                VALUES (?, 'LinkedIn', ?, ?, ?, ?, ?, 'scraped', ?, ?, ?, ?)`,
                [...liVals, userId]);
            } else {
              runQuery(`INSERT OR IGNORE INTO jobs
                (id, src, ref, title, employer, location, remote, state, match, url, posted_days)
                VALUES (?, 'LinkedIn', ?, ?, ?, ?, ?, 'scraped', ?, ?, ?)`,
                liVals);
            }
            emit(id, 'job', `New: ${job.title} @ ${job.companyDetails?.name || job.companyName}`, { ref: String(ref), headline: job.title, employer: job.companyDetails?.name || job.companyName || 'Unknown', src: 'LinkedIn', url: job.listingUrl || job.url || '' });
          }
        }
      } else {
        emit(id, 'warn', `LinkedIn: ${liResult.error}`);
      }
    } catch (err) {
      emit(id, 'error', `LinkedIn search error: ${err.message}`);
    }
  } else {
    emit(id, 'warn', 'LinkedIn not connected — link your account in Settings to enable LinkedIn job search');
  }

  // Done
  ACTIVE_SCRAPES.set(id, { status: 'completed', keywords, completedAt: new Date().toISOString(), totalFound });
  runQuery(`UPDATE runs SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
  emit(id, 'done', `Scrape complete — ${totalFound} new jobs found`);
  setTimeout(() => ACTIVE_SCRAPES.delete(id), 60000);

  return { runId: id, totalFound };
  } catch (err) {
    emit(id, 'error', `Scrape failed: ${err.message}`);
    ACTIVE_SCRAPES.set(id, { status: 'error', keywords, completedAt: new Date().toISOString(), error: err.message });
    runQuery(`UPDATE runs SET status = 'failed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    setTimeout(() => ACTIVE_SCRAPES.delete(id), 60000);
    return { runId: id, error: err.message, totalFound };
  }
}
