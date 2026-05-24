import express from 'express';
import { RunModel } from '../models/Run.js';

const router = express.Router();

// GET /api/runs - List all runs with optional filters
router.get('/', (req, res, next) => {
  try {
    const runs = RunModel.findAll(req.query);
    res.json({
      runs,
      count: runs.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/runs/:id - Get single run
router.get('/:id', (req, res, next) => {
  try {
    const run = RunModel.findById(req.params.id);
    if (!run) {
      return res.status(404).json({
        error: 'Run not found',
        id: req.params.id,
      });
    }
    res.json({ run });
  } catch (err) {
    next(err);
  }
});

// POST /api/runs - Create new run
router.post('/', (req, res, next) => {
  try {
    const run = RunModel.create(req.body);
    res.status(201).json({ run });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/runs/:id - Update run
router.patch('/:id', (req, res, next) => {
  try {
    const run = RunModel.update(req.params.id, req.body);
    if (!run) {
      return res.status(404).json({
        error: 'Run not found',
        id: req.params.id,
      });
    }
    res.json({ run });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/runs/:id - Delete run
router.delete('/:id', (req, res, next) => {
  try {
    RunModel.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
