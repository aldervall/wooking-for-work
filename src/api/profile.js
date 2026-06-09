import { Router } from 'express';
import { importLinkedInProfile } from '../services/linkedin-importer.js';
import { runQuery, getOne } from '../database/db.js';

const router = Router();

const pendingImports = new Map();

function getUserProfile(userId) {
  const row = getOne('SELECT * FROM profiles WHERE user_id = ?', [userId]);
  if (!row) return null;
  return {
    ...row,
    linkedinData: row.linkedin_data ? JSON.parse(row.linkedin_data) : null,
    skills: row.skills ? JSON.parse(row.skills) : [],
    preferences: row.preferences ? JSON.parse(row.preferences) : null,
  };
}

function ensureUserProfile(userId) {
  const existing = getOne('SELECT id FROM profiles WHERE user_id = ?', [userId]);
  if (!existing) {
    const id = crypto.randomUUID();
    runQuery(`INSERT INTO profiles (id, user_id, status) VALUES (?, ?, 'empty')`, [id, userId]);
  }
}

import crypto from 'crypto';

router.get('/', (req, res) => {
  ensureUserProfile(req.currentUser.id);
  const profile = getUserProfile(req.currentUser.id);
  if (profile?.status === 'importing' && !pendingImports.has(req.currentUser.id)) {
    runQuery(`UPDATE profiles SET status = 'empty' WHERE user_id = ?`, [req.currentUser.id]);
    profile.status = 'empty';
  }
  res.json({ profile });
});

router.patch('/', (req, res) => {
  const { name, email, phone, headline, location, skills, preferences, status } = req.body;
  const updates = [];
  const vals = [];
  if (name !== undefined) { updates.push('name = ?'); vals.push(name); }
  if (email !== undefined) { updates.push('email = ?'); vals.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); vals.push(phone); }
  if (headline !== undefined) { updates.push('headline = ?'); vals.push(headline); }
  if (location !== undefined) { updates.push('location = ?'); vals.push(location); }
  if (skills !== undefined) { updates.push('skills = ?'); vals.push(JSON.stringify(skills)); }
  if (preferences !== undefined) { updates.push('preferences = ?'); vals.push(JSON.stringify(preferences)); }
  if (status !== undefined) { updates.push('status = ?'); vals.push(status); }
  if (updates.length) {
    runQuery(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`, [...vals, req.currentUser.id]);
  }
  res.json({ profile: getUserProfile(req.currentUser.id) });
});

router.delete('/', (req, res) => {
  runQuery('DELETE FROM profiles WHERE user_id = ?', [req.currentUser.id]);
  pendingImports.delete(req.currentUser.id);
  res.json({ ok: true });
});

router.post('/linkedin', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('linkedin.com/in/')) {
    return res.status(400).json({ error: 'Valid LinkedIn profile URL required (e.g. https://linkedin.com/in/username)' });
  }

  ensureUserProfile(req.currentUser.id);
  runQuery(`UPDATE profiles SET linkedin_url = ?, status = 'importing' WHERE user_id = ?`, [url, req.currentUser.id]);
  res.json({ profile: getUserProfile(req.currentUser.id) });

  if (pendingImports.has(req.currentUser.id)) return;

  const prom = importLinkedInProfile(url);
  pendingImports.set(req.currentUser.id, prom);
  const result = await prom;
  pendingImports.delete(req.currentUser.id);

  if (result.ok) {
    runQuery(`UPDATE profiles SET
      status = 'ready',
      linkedin_username = ?,
      linkedin_data = ?,
      name = ?,
      headline = ?,
      location = ?,
      avatar_url = ?,
      skills = ?
      WHERE user_id = ?`, [
      result.username,
      JSON.stringify(result.data),
      result.data.name || null,
      result.data.headline || null,
      result.data.location || null,
      result.data.avatarUrl || null,
      JSON.stringify(result.data.skills || []),
      req.currentUser.id,
    ]);
  } else {
    runQuery(`UPDATE profiles SET status = 'empty' WHERE user_id = ?`, [req.currentUser.id]);
  }
});

router.get('/import-status', (req, res) => {
  const profile = getUserProfile(req.currentUser.id);
  const importing = profile?.status === 'importing';
  res.json({ importing, profile });
});

export default router;
