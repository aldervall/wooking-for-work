#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { randomUUID } from 'crypto';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/wooking.db');
const dataFilePath = path.resolve(__dirname, '../public/js/data.js');

console.log('Wooking for Work - Database Seed Script\n');

// Remove existing database
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database...');
  fs.unlinkSync(dbPath);
}

// Initialize database with schema
const schemaPath = path.resolve(__dirname, '../src/database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Creating database schema...');
db.exec(schema);

// Read and parse data.js file
console.log('Reading mock data from data.js...');
const dataContent = fs.readFileSync(dataFilePath, 'utf-8');

// Create a sandboxed context to execute the JavaScript
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataContent, sandbox);

const mockData = sandbox.window.WK_DATA;

if (!mockData || !mockData.jobs) {
  console.error('Could not parse data from data.js');
  process.exit(1);
}

console.log(`Found ${mockData.jobs.length} jobs to import`);

// Prepare insert statement
const insertJob = db.prepare(`
  INSERT INTO jobs (
    id, src, ref, title, employer, location, distance,
    language, remote, posted_days, match, state, salary,
    closing, excerpt, skills, url, tags, submitted_at, replied_at,
    tailored_cv_done, tailored_pb_done, slug
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Import jobs
const importJobs = db.transaction((jobs) => {
  let imported = 0;
  for (const job of jobs) {
    try {
      insertJob.run(
        job.id,
        job.src,
        job.ref || job.id,
        job.title,
        job.employer,
        job.location,
        job.distance || null,
        job.language,
        String(job.remote),
        job.postedDays || 0,
        job.match,
        job.state || 'scraped',
        job.salary || null,
        job.closing || null,
        job.excerpt || '',
        JSON.stringify(job.skills || []),
        job.url,
        JSON.stringify(job.tags || []),
        job.submittedAt || null,
        job.repliedAt || null,
        job.tailored?.cvDone ? 1 : 0,
        job.tailored?.pbDone ? 1 : 0,
        job.slug || null
      );
      imported++;
    } catch (err) {
      console.error(`Failed to import job ${job.id}:`, err.message);
    }
  }
  return imported;
});

const jobsImported = importJobs(mockData.jobs);
console.log(`✓ Imported ${jobsImported} jobs`);

// Import activities if they exist
if (mockData.reportActivities && mockData.reportActivities.length > 0) {
  const insertActivity = db.prepare(`
    INSERT INTO activities (id, job_id, evidence, note, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const importActivities = db.transaction((activities) => {
    let imported = 0;
    for (const activity of activities) {
      try {
        const job = mockData.jobs.find(j => j.id === activity.jobId);
        if (!job) continue;
        
        insertActivity.run(
          `act-${randomUUID().slice(0, 8)}`,
          activity.jobId,
          activity.evidence ? 1 : 0,
          activity.note,
          activity.createdAt || new Date().toISOString()
        );
        imported++;
      } catch (err) {
        console.error(`Failed to import activity:`, err.message);
      }
    }
    return imported;
  });
  
  const activitiesImported = importActivities(mockData.reportActivities);
  console.log(`✓ Imported ${activitiesImported} activities`);
}

db.close();

console.log(`\n✓ Database seeded successfully!\n`);
console.log(`Database location: ${dbPath}`);
console.log(`\nYou can now start the server with: npm start`);
