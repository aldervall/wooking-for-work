import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../database/db.js';

export function registerUser(email, password, name) {
  if (!email || !email.includes('@')) {
    const err = new Error('Invalid email format');
    err.status = 400;
    throw err;
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }
  const id = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(id, email, passwordHash, name || null);

  const profileId = crypto.randomUUID();
  const profileName = name || email.split('@')[0];
  db.prepare('INSERT INTO profiles (id, user_id, name, email, status) VALUES (?, ?, ?, ?, ?)').run(profileId, id, profileName, email, 'empty');

  return { id, email, name: name || null };
}

export function authenticateUser(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return null;
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export function getUserById(id) {
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(id);
  if (!user) return null;
  return user;
}
