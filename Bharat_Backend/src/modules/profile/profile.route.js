import express from 'express';
import * as profileController from './profile.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all profile routes
router.use(authenticateToken);

// CRUD routes for the authenticated user's profile
router.post('/', profileController.createProfile);
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.delete('/', profileController.deleteProfile);

// CRUD routes for a specific user's profile (e.g. for admin access)
router.get('/:userId', profileController.getProfile);
router.put('/:userId', profileController.updateProfile);
router.delete('/:userId', profileController.deleteProfile);

export default router;
