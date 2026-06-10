import crypto from 'crypto';
import db from '../database/db.js';

function getEncryptionKey() {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'CREDENTIAL_ENCRYPTION_KEY not set. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(key, 'hex');
}

function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({ iv: iv.toString('hex'), authTag, data: encrypted });
}

function decrypt(encryptedPayload) {
  const key = getEncryptionKey();
  const { iv, authTag, data } = JSON.parse(encryptedPayload);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function storeCredential(userId, provider, value, metadata = {}) {
  const id = crypto.randomUUID();
  const encrypted = encrypt(value);
  db.prepare(
    'INSERT OR REPLACE INTO user_credentials (id, user_id, provider, encrypted_value, metadata) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, provider, encrypted, JSON.stringify(metadata));
  return id;
}

export function getCredential(userId, provider) {
  const row = db.prepare(
    'SELECT encrypted_value FROM user_credentials WHERE user_id = ? AND provider = ?'
  ).get(userId, provider);
  if (!row) return null;
  return decrypt(row.encrypted_value);
}

export function deleteCredential(userId, provider) {
  db.prepare('DELETE FROM user_credentials WHERE user_id = ? AND provider = ?').run(userId, provider);
}

export function listProviders(userId) {
  return db.prepare(
    'SELECT provider, metadata FROM user_credentials WHERE user_id = ? ORDER BY provider'
  ).all(userId);
}
