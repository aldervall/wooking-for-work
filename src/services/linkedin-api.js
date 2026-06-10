import crypto from 'crypto';
import { getOne, runQuery } from '../database/db.js';

const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';
const API_BASE = 'https://api.linkedin.com/v2';

export function getClientId() {
  return process.env.LINKEDIN_CLIENT_ID || '';
}

export function getRedirectUri() {
  return process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3002/api/auth/linkedin/callback';
}

export function getOAuthUrl(state) {
  const clientId = getClientId();
  if (!clientId) return null;
  const redirect = encodeURIComponent(getRedirectUri());
  const scope = encodeURIComponent('openid profile email');
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirect}&state=${state}&scope=${scope}`;
}

const stateStore = new Map(); // OAuth state -> { userId } for callback recovery

export function storeOAuthState(userId) {
  const state = crypto.randomUUID();
  stateStore.set(state, { userId });
  return state;
}

export function consumeOAuthState(state) {
  const entry = stateStore.get(state);
  if (entry) stateStore.delete(state);
  return entry || null;
}

async function exchangeCode(code) {
  const clientId = getClientId();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) throw new Error('LinkedIn OAuth not configured — set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri(),
  });

  const res = await fetch(TOKEN_URL, { method: 'POST', body });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function refreshToken(refreshTokenStr) {
  const clientId = getClientId();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshTokenStr,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_URL, { method: 'POST', body });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

export async function handleCallback(code, userId = null) {
  const token = await exchangeCode(code);
  const profile = await fetchProfile(token.access_token);
  const expiresAt = token.expires_in ? Math.floor(Date.now() / 1000) + token.expires_in : null;

  const data = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token || null,
    expiresAt,
    scope: token.scope || '',
    profile,
  };

  if (userId) {
    runQuery(`UPDATE profiles SET
      linkedin_data = ?,
      linkedin_username = ?,
      name = COALESCE(NULLIF(name, ''), ?),
      headline = COALESCE(NULLIF(headline, ''), ?),
      avatar_url = COALESCE(NULLIF(avatar_url, ''), ?)
      WHERE user_id = ?`, [
      JSON.stringify(data),
      profile.sub || '',
      profile.name || '',
      profile.headline || '',
      profile.picture || '',
      userId,
    ]);

    runQuery(`INSERT OR REPLACE INTO tokens (id, provider, access_token, refresh_token, expires_at, scope, profile, user_id)
      VALUES (?, 'linkedin', ?, ?, ?, ?, ?, ?)`, [
      `linkedin-${userId}`,
      token.access_token,
      token.refresh_token || null,
      expiresAt,
      token.scope || '',
      JSON.stringify(profile),
      userId,
    ]);
  } else {
    // Backward compat: store with hardcoded id when no userId
    runQuery(`UPDATE profiles SET
      linkedin_data = ?,
      linkedin_username = ?,
      name = COALESCE(NULLIF(name, ''), ?),
      headline = COALESCE(NULLIF(headline, ''), ?),
      avatar_url = COALESCE(NULLIF(avatar_url, ''), ?)
      WHERE id = 'default'`, [
      JSON.stringify(data),
      profile.sub || '',
      profile.name || '',
      profile.headline || '',
      profile.picture || '',
    ]);

    runQuery(`INSERT OR REPLACE INTO tokens (id, provider, access_token, refresh_token, expires_at, scope, profile)
      VALUES (?, 'linkedin', ?, ?, ?, ?, ?)`, [
      'linkedin',
      token.access_token,
      token.refresh_token || null,
      expiresAt,
      token.scope || '',
      JSON.stringify(profile),
    ]);
  }

  return profile;
}

export async function fetchProfile(accessToken) {
  const res = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`LinkedIn profile fetch failed: ${res.status}`);
  return res.json();
}

export async function getValidToken(userId = null) {
  if (userId) {
    const row = getOne('SELECT * FROM tokens WHERE provider = ? AND user_id = ?', ['linkedin', userId]);
    if (!row) return null;
    if (row.expires_at && row.expires_at > Math.floor(Date.now() / 1000) + 300) {
      return row.access_token;
    }
    if (row.refresh_token) {
      try {
        const refreshed = await refreshToken(row.refresh_token);
        const expiresAt = refreshed.expires_in ? Math.floor(Date.now() / 1000) + refreshed.expires_in : null;
        runQuery(`UPDATE tokens SET access_token = ?, refresh_token = ?, expires_at = ?, scope = ?
          WHERE id = ?`, [
          refreshed.access_token,
          refreshed.refresh_token || row.refresh_token,
          expiresAt,
          refreshed.scope || row.scope,
          row.id,
        ]);
        return refreshed.access_token;
      } catch {
        runQuery('DELETE FROM tokens WHERE id = ?', [row.id]);
        return null;
      }
    }
    runQuery('DELETE FROM tokens WHERE id = ?', [row.id]);
    return null;
  }

  // Backward compat: fall back to hardcoded id lookup
  const row = getOne('SELECT * FROM tokens WHERE id = ?', ['linkedin']);
  if (!row) return null;
  if (row.expires_at && row.expires_at > Math.floor(Date.now() / 1000) + 300) {
    return row.access_token;
  }
  if (row.refresh_token) {
    try {
      const refreshed = await refreshToken(row.refresh_token);
      const expiresAt = refreshed.expires_in ? Math.floor(Date.now() / 1000) + refreshed.expires_in : null;
      runQuery(`UPDATE tokens SET access_token = ?, refresh_token = ?, expires_at = ?, scope = ?
        WHERE id = 'linkedin'`, [
        refreshed.access_token,
        refreshed.refresh_token || row.refresh_token,
        expiresAt,
        refreshed.scope || row.scope,
      ]);
      return refreshed.access_token;
    } catch {
      runQuery('DELETE FROM tokens WHERE id = ?', ['linkedin']);
      return null;
    }
  }
  runQuery('DELETE FROM tokens WHERE id = ?', ['linkedin']);
  return null;
}

export async function searchJobsLi(keywords, location) {
  const token = await getValidToken();
  if (!token) return { ok: false, error: 'LinkedIn not connected' };
  try {
    const params = new URLSearchParams({ q: keywords, count: '25' });
    if (location) params.set('location', location);
    const res = await fetch(`${API_BASE}/jobs?${params}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0' },
    });
    if (!res.ok) return { ok: false, error: `LinkedIn API error: ${res.status}` };
    const data = await res.json();
    return { ok: true, jobs: data.elements || [] };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
