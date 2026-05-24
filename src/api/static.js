import express from 'express';
import { getAll } from '../database/db.js';

const router = express.Router();

// GET /api/states - Get all pipeline states
router.get('/states', (req, res, next) => {
  try {
    const states = getAll('SELECT * FROM states ORDER BY display_order');
    res.json({ states });
  } catch (err) {
    next(err);
  }
});

// GET /api/commands - Get all command palette commands
router.get('/commands', (req, res, next) => {
  try {
    const rows = getAll('SELECT * FROM commands ORDER BY cmd_group, id');
    const commands = rows.map(row => ({
      id: row.id,
      label: row.label,
      keys: JSON.parse(row.keys),
      hint: row.hint,
      group: row.cmd_group,
    }));
    res.json({ commands });
  } catch (err) {
    next(err);
  }
});

export default router;
