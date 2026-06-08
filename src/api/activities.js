import express from 'express';
import { ActivityModel } from '../models/Activity.js';

const router = express.Router();

// GET /api/activities - List all activities with optional filters
router.get('/', (req, res, next) => {
  try {
    const activities = ActivityModel.findAll(req.currentUser.id, req.query);
    res.json({
      activities,
      count: activities.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/activities/:id - Get single activity
router.get('/:id', (req, res, next) => {
  try {
    const activity = ActivityModel.findById(req.currentUser.id, req.params.id);
    if (!activity) {
      return res.status(404).json({
        error: 'Activity not found',
        id: req.params.id,
      });
    }
    res.json({ activity });
  } catch (err) {
    next(err);
  }
});

// POST /api/activities - Create new activity
router.post('/', (req, res, next) => {
  try {
    const activity = ActivityModel.create(req.currentUser.id, req.body);
    if (!activity) {
      return res.status(404).json({
        error: 'Job not found',
        jobId: req.body.jobId,
      });
    }
    res.status(201).json({ activity });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', (req, res, next) => {
  try {
    const deleted = ActivityModel.delete(req.currentUser.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'Activity not found',
        id: req.params.id,
      });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
