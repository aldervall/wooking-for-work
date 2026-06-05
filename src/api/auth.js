import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { registerUser, authenticateUser } from '../services/auth-service.js';
import { getOAuthUrl, handleCallback, getValidToken } from '../services/linkedin-api.js';

const router = Router();

// Register
router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = registerUser(email, password, name);
    req.session.userId = user.id;
    res.status(201).json(user);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    req.session.userId = user.id;
    res.json(user);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out' });
  });
});

// Me (uses optionalUser from global middleware)
router.get('/me', (req, res) => {
  if (req.currentUser) {
    return res.json(req.currentUser);
  }
  res.status(401).json({ error: 'Not authenticated' });
});

// LinkedIn OAuth
router.get('/linkedin', (req, res) => {
  const state = uuid();
  const url = getOAuthUrl(state);
  if (!url) {
    return res.status(400).json({ error: 'LinkedIn OAuth not configured — set LINKEDIN_CLIENT_ID in .env' });
  }
  res.redirect(url);
});

router.get('/linkedin/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.status(400).send(`<script>window.opener?.postMessage({ type: 'linkedin-oauth', error: '${error}' }, '*'); window.close();</script><p>LinkedIn auth failed (${error}). You can close this tab.</p>`);
  }
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const profile = await handleCallback(code);
    res.send(`<script>window.opener?.postMessage({ type: 'linkedin-oauth', ok: true, name: '${profile.name || ''}' }, '*'); window.close();</script>
      <p>LinkedIn connected! You can close this tab.</p>
      <style>body{font-family:sans-serif;padding:40px;text-align:center;color:#333}p{font-size:16px}</style>`);
  } catch (err) {
    res.status(500).send(`<script>window.opener?.postMessage({ type: 'linkedin-oauth', error: '${err.message}' }, '*'); window.close();</script>
      <p>LinkedIn auth error: ${err.message}</p>
      <style>body{font-family:sans-serif;padding:40px;color:red}</style>`);
  }
});

router.get('/linkedin/status', async (req, res) => {
  const token = await getValidToken();
  res.json({ connected: !!token });
});

export default router;
