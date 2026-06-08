import { getAll, getOne, runQuery } from '../database/db.js';
import { randomUUID } from 'crypto';

export class ActivityModel {
  /**
   * Find all activities with optional filtering
   */
  static findAll(userId, filters = {}) {
    let sql = 'SELECT activities.* FROM activities INNER JOIN jobs ON jobs.id = activities.job_id WHERE jobs.user_id = ?';
    const params = [userId];
    
    if (filters.jobId) {
      sql += ' AND job_id = ?';
      params.push(filters.jobId);
    }
    
    if (filters.evidence === 'true' || filters.withEvidence === 'true') {
      sql += ' AND evidence = 1';
    }
    
    if (filters.month) {
      sql += ' AND substr(activities.created_at, 1, 7) = ?';
      params.push(filters.month);
    }
    
    sql += ' ORDER BY activities.created_at DESC';
    
    const rows = getAll(sql, params);
    return rows.map(this.deserialize);
  }
  
  /**
   * Find single activity by ID
   */
  static findById(userId, id) {
    const row = getOne(
      'SELECT activities.* FROM activities INNER JOIN jobs ON jobs.id = activities.job_id WHERE activities.id = ? AND jobs.user_id = ?',
      [id, userId]
    );
    return row ? this.deserialize(row) : null;
  }
  
  /**
   * Create new activity
   */
  static create(userId, data) {
    const job = getOne('SELECT id FROM jobs WHERE id = ? AND user_id = ?', [data.jobId, userId]);
    if (!job) return null;
    
    const id = data.id || `act-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    
    runQuery(`
      INSERT INTO activities (id, job_id, evidence, note, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      data.jobId,
      data.evidence ? 1 : 0,
      data.note,
      now,
    ]);
    
    return this.findById(userId, id);
  }
  
  /**
   * Delete activity
   */
  static delete(userId, id) {
    const result = runQuery(
      'DELETE FROM activities WHERE id = ? AND job_id IN (SELECT id FROM jobs WHERE user_id = ?)',
      [id, userId]
    );
    return result.changes > 0;
  }
  
  /**
   * Convert database row to JavaScript object
   */
  static deserialize(row) {
    return {
      id: row.id,
      jobId: row.job_id,
      evidence: Boolean(row.evidence),
      note: row.note,
      createdAt: row.created_at,
    };
  }
}
