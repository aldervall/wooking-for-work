import { getAll, getOne, runQuery } from '../database/db.js';
import { randomUUID } from 'crypto';

export class JobModel {
  /**
   * Find all jobs with optional filtering
   */
  static findAll(filters = {}, userId) {
    let sql = 'SELECT * FROM jobs WHERE user_id = ?';
    const params = [userId];
    
    if (filters.state) {
      sql += ' AND state = ?';
      params.push(filters.state);
    }
    
    if (filters.src) {
      sql += ' AND src = ?';
      params.push(filters.src);
    }
    
    if (filters.q) {
      sql += ' AND (title LIKE ? OR employer LIKE ? OR skills LIKE ?)';
      const pattern = `%${filters.q}%`;
      params.push(pattern, pattern, pattern);
    }
    
    if (filters.minMatch) {
      sql += ' AND match >= ?';
      params.push(parseInt(filters.minMatch, 10));
    }
    
    if (filters.maxDistance) {
      sql += ' AND (distance IS NULL OR distance <= ?)';
      params.push(parseInt(filters.maxDistance, 10));
    }
    
    if (filters.remote === 'true') {
      sql += ' AND remote IN ("true", "hybrid")';
    }
    
    sql += ' ORDER BY match DESC, created_at DESC';
    
    const rows = getAll(sql, params);
    return rows.map(this.deserialize);
  }
  
  /**
   * Find single job by ID
   */
  static findById(id, userId) {
    const row = getOne('SELECT * FROM jobs WHERE id = ? AND user_id = ?', [id, userId]);
    return row ? this.deserialize(row) : null;
  }
  
  /**
   * Create new job
   */
  static create(data, userId) {
    const id = data.id || `j-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    
    runQuery(`
      INSERT INTO jobs (
        id, src, ref, title, employer, location, distance,
        language, remote, posted_days, match, state, salary,
        closing, excerpt, skills, url, tags, scraped_at, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.src,
      data.ref,
      data.title,
      data.employer,
      data.location,
      data.distance || null,
      data.language,
      String(data.remote),
      data.postedDays || 0,
      data.match,
      data.state || 'scraped',
      data.salary || null,
      data.closing || null,
      data.excerpt || '',
      JSON.stringify(data.skills || []),
      data.url,
      JSON.stringify(data.tags || []),
      now,
      userId,
    ]);
    
    return this.findById(id, userId);
  }
  
  /**
   * Update existing job
   */
  static update(id, updates, userId) {
    const allowed = [
      'state', 'match', 'salary', 'closing', 'excerpt',
      'submitted_at', 'replied_at', 'tailored_cv_done',
      'tailored_pb_done', 'slug', 'skills', 'tags'
    ];
    
    const sets = [];
    const params = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = key.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
      if (allowed.includes(snakeKey)) {
        sets.push(`${snakeKey} = ?`);
        if (snakeKey === 'skills' || snakeKey === 'tags') {
          params.push(JSON.stringify(value));
        } else if (snakeKey.includes('_done')) {
          params.push(value ? 1 : 0);
        } else {
          params.push(value);
        }
      }
    });
    
    // Handle tailored object updates
    if (updates.tailored) {
      if (updates.tailored.cvDone !== undefined) {
        sets.push('tailored_cv_done = ?');
        params.push(updates.tailored.cvDone ? 1 : 0);
      }
      if (updates.tailored.pbDone !== undefined) {
        sets.push('tailored_pb_done = ?');
        params.push(updates.tailored.pbDone ? 1 : 0);
      }
    }
    
    if (sets.length === 0) {
      return this.findById(id, userId);
    }
    
    params.push(id, userId);
    runQuery(
      `UPDATE jobs SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    
    return this.findById(id, userId);
  }
  
  /**
   * Delete job
   */
  static delete(id, userId) {
    runQuery('DELETE FROM jobs WHERE id = ? AND user_id = ?', [id, userId]);
  }
  
  /**
   * Convert database row to JavaScript object
   */
  static deserialize(row) {
    return {
      id: row.id,
      src: row.src,
      ref: row.ref,
      title: row.title,
      employer: row.employer,
      location: row.location,
      distance: row.distance,
      language: row.language,
      remote: row.remote === 'true' ? true : row.remote === 'false' ? false : row.remote,
      postedDays: row.posted_days,
      match: row.match,
      state: row.state,
      salary: row.salary,
      closing: row.closing,
      excerpt: row.excerpt,
      skills: JSON.parse(row.skills || '[]'),
      url: row.url,
      tags: JSON.parse(row.tags || '[]'),
      scrapedAt: row.scraped_at,
      submittedAt: row.submitted_at,
      repliedAt: row.replied_at,
      tailored: {
        cvDone: Boolean(row.tailored_cv_done),
        pbDone: Boolean(row.tailored_pb_done),
      },
      slug: row.slug,
    };
  }
}
