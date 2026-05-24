import express from 'express';
import { JobModel } from '../models/Job.js';

const router = express.Router();

// GET /api/jobs - List all jobs with optional filters
router.get('/', (req, res, next) => {
  try {
    const jobs = JobModel.findAll(req.query);
    res.json({
      jobs,
      count: jobs.length,
      filters: req.query,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id - Get single job
router.get('/:id', (req, res, next) => {
  try {
    const job = JobModel.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        id: req.params.id,
      });
    }
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs - Create new job
router.post('/', (req, res, next) => {
  try {
    const job = JobModel.create(req.body);
    res.status(201).json({ job, id: job.id });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/jobs/:id - Update job
router.patch('/:id', (req, res, next) => {
  try {
    const job = JobModel.update(req.params.id, req.body);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        id: req.params.id,
      });
    }
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', (req, res, next) => {
  try {
    JobModel.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
