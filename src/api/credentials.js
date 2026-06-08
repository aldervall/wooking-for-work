import { Router } from 'express';
import * as credService from '../services/credential-service.js';

const router = Router();

// List credential providers for current user (values never exposed)
router.get('/', (req, res, next) => {
  try {
    const providers = credService.listProviders(req.currentUser.id);
    res.json({ credentials: providers });
  } catch (err) {
    next(err);
  }
});

// Store a credential
router.post('/', (req, res, next) => {
  try {
    const { provider, value, metadata } = req.body;
    if (!provider || !value) {
      return res.status(400).json({ error: 'provider and value are required' });
    }
    const id = credService.storeCredential(req.currentUser.id, provider, value, metadata || {});
    res.status(201).json({ id, provider });
  } catch (err) {
    next(err);
  }
});

// Delete a credential
router.delete('/:provider', (req, res, next) => {
  try {
    credService.deleteCredential(req.currentUser.id, req.params.provider);
    res.json({ message: 'Credential deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
