import { getAll, getOne, runQuery } from '../database/db.js';
import { randomUUID } from 'crypto';

export class RunModel {
  /**
   * Find all runs with optional filtering
   */
  static findAll(filters = {}) {
    let sql = 'SELECT * FROM runs WHERE 1=1';
    const params = [];
    
    if (filters.jobId) {
      sql += ' AND job_id = ?';
      params.push(filters.jobId);
    }
    
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    sql += ' ORDER BY started_at DESC';
    
    const rows = getAll(sql, params);
    return rows.map(this.deserialize);
  }
  
  /**
   * Find single run by ID
   */
  static findById(id) {
    const row = getOne('SELECT * FROM runs WHERE id = ?', [id]);
    return row ? this.deserialize(row) : null;
  }
  
  /**
   * Create new run
   */
  static create(data) {
    const id = data.id || `run-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    
    runQuery(`
      INSERT INTO runs (id, job_id, status, started_at, steps)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      data.jobId,
      data.status || 'queued',
      now,
      JSON.stringify(data.steps || []),
    ]);
    
    return this.findById(id);
  }
  
  /**
   * Update existing run
   */
  static update(id, updates) {
    const allowed = ['status', 'completed_at', 'duration', 'steps', 'artifacts_cv_path', 'artifacts_pb_path'];
    
    const sets = [];
    const params = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      const snakeKey = key.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
      if (allowed.includes(snakeKey)) {
        sets.push(`${snakeKey} = ?`);
        if (snakeKey === 'steps') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    });
    
    // Handle artifacts object updates
    if (updates.artifacts) {
      if (updates.artifacts.cvPath !== undefined) {
        sets.push('artifacts_cv_path = ?');
        params.push(updates.artifacts.cvPath);
      }
      if (updates.artifacts.pbPath !== undefined) {
        sets.push('artifacts_pb_path = ?');
        params.push(updates.artifacts.pbPath);
      }
    }
    
    if (sets.length === 0) {
      return this.findById(id);
    }
    
    params.push(id);
    runQuery(
      `UPDATE runs SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    
    return this.findById(id);
  }
  
  /**
   * Delete run
   */
  static delete(id) {
    runQuery('DELETE FROM runs WHERE id = ?', [id]);
  }
  
  /**
   * Convert database row to JavaScript object
   */
  static deserialize(row) {
    return {
      id: row.id,
      jobId: row.job_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      duration: row.duration,
      steps: JSON.parse(row.steps || '[]'),
      artifacts: {
        cvPath: row.artifacts_cv_path,
        pbPath: row.artifacts_pb_path,
      },
    };
  }
}
