import { getAll, getOne, runQuery } from '../database/db.js';
import { randomUUID } from 'crypto';

export class RunModel {
  static findAll(filters = {}, userId = null) {
    let sql = 'SELECT r.* FROM runs r JOIN jobs j ON r.job_id = j.id WHERE 1=1';
    const params = [];

    if (userId) {
      sql += ' AND j.user_id = ?';
      params.push(userId);
    }

    if (filters.jobId) {
      sql += ' AND r.job_id = ?';
      params.push(filters.jobId);
    }

    if (filters.status) {
      sql += ' AND r.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY r.started_at DESC';

    const rows = getAll(sql, params);
    return rows.map(this.deserialize);
  }

  static findById(id, userId = null) {
    let sql = 'SELECT r.* FROM runs r JOIN jobs j ON r.job_id = j.id WHERE r.id = ?';
    const params = [id];

    if (userId) {
      sql += ' AND j.user_id = ?';
      params.push(userId);
    }

    const row = getOne(sql, params);
    return row ? this.deserialize(row) : null;
  }

  static create(data, userId = null) {
    if (userId && data.jobId) {
      const job = getOne('SELECT id FROM jobs WHERE id = ? AND user_id = ?', [data.jobId, userId]);
      if (!job) {
        throw new Error('Job not found or access denied');
      }
    }

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

  static update(id, updates, userId = null) {
    if (userId) {
      const run = getOne(
        'SELECT r.id FROM runs r JOIN jobs j ON r.job_id = j.id WHERE r.id = ? AND j.user_id = ?',
        [id, userId]
      );
      if (!run) return null;
    }

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
      return this.findById(id, userId);
    }

    params.push(id);
    runQuery(
      `UPDATE runs SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id, userId);
  }

  static delete(id, userId = null) {
    if (userId) {
      const run = getOne(
        'SELECT r.id FROM runs r JOIN jobs j ON r.job_id = j.id WHERE r.id = ? AND j.user_id = ?',
        [id, userId]
      );
      if (!run) {
        throw new Error('Run not found');
      }
    }

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
