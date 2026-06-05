import bcrypt from 'bcrypt';
import crypto from 'crypto';

function log(step, detail) {
  console.log(`  [migration 001_multi_user] ${step}: ${detail}`);
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  let pw = '';
  for (let i = 0; i < 16; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

export function runMigration(db) {
  const existingUsers = db.prepare('SELECT COUNT(*) AS cnt FROM users').get();
  if (existingUsers.cnt > 0) {
    log('skip', 'users table already has data — migration already applied');
    return;
  }

  const defaultProfile = db.prepare("SELECT * FROM profiles WHERE id = 'default'").get();
  if (!defaultProfile) {
    log('skip', 'no default profile found — no data to migrate');
    return;
  }

  log('start', 'converting single-user data to multi-user...');

  const profileEmail = defaultProfile.email || null;
  const profileName = defaultProfile.name || 'Default User';
  const userId = crypto.randomUUID();

  const userPassword = process.env.DEFAULT_USER_PASSWORD || generatePassword();
  const passwordHash = bcrypt.hashSync(userPassword, 10);

  if (!process.env.DEFAULT_USER_PASSWORD) {
    log('warn', `No DEFAULT_USER_PASSWORD env var set. Generated password: ${userPassword}`);
    log('warn', 'Set DEFAULT_USER_PASSWORD in .env to use a fixed password');
  }

  const userEmail = profileEmail || `default-${userId.slice(0, 8)}@local.dev`;
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
  ).run(userId, userEmail, passwordHash, profileName);
  log('user', `created user "${profileName}" <${userEmail}> (id: ${userId})`);

  const profileNewId = crypto.randomUUID();
  db.prepare(
    "UPDATE profiles SET user_id = ?, id = ? WHERE id = 'default'"
  ).run(userId, profileNewId);
  log('profiles', `updated 1 row — new id: ${profileNewId}, user_id: ${userId}`);

  const jobsResult = db.prepare(
    'UPDATE jobs SET user_id = ? WHERE user_id IS NULL'
  ).run(userId);
  if (jobsResult.changes > 0) {
    log('jobs', `updated ${jobsResult.changes} row(s)`);
  } else {
    log('jobs', 'no rows to update');
  }

  const tokensResult = db.prepare(
    'UPDATE tokens SET user_id = ? WHERE user_id IS NULL'
  ).run(userId);
  if (tokensResult.changes > 0) {
    log('tokens', `updated ${tokensResult.changes} row(s)`);
  } else {
    log('tokens', 'no rows to update');
  }

  log('done', 'migration complete');
}
