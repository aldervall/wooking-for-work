import { getAll, getOne, runQuery } from '../database/db.js';
import { randomUUID } from 'crypto';

export class ActivityModel {
  /**
   * Find all activities with optional filtering
   */
  static findAll(filters = {}) {
    let sql = 'SELECT * FROM activities WHERE 1=1';
    const params = [];
    
    if (filters.jobId) {
      sql += ' AND job_id = ?';
      params.push(filters.jobId);
    }
    
    if (filters.evidence === 'true' || filters.withEvidence === 'true') {
      sql += ' AND evidence = 1';
    }
    
    if (filters.month) {
      sql += ' AND substr(created_at, 1, 7) = ?';
      params.push(filters.month);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const rows = getAll(sql, params);
    return rows.map(this.deserialize);
  }
  
  /**
   * Find single activity by ID
   */
  static findById(id) {
    const row = getOne('SELECT * FROM activities WHERE id = ?', [id]);
    return row ? this.deserialize(row) : null;
  }
  
  /**
   * Create new activity
   */
  static create(data) {
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
    
    return this.findById(id);
  }
  
  /**
   * Delete activity
   */
  static delete(id) {
    runQuery('DELETE FROM activities WHERE id = ?', [id]);
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
