import express from 'express';
import * as usersController from './users.controller.js';

const router = express.Router();

// Optionally apply authentication middleware if required
// import { authenticateToken } from '../../middleware/auth.middleware.js';
// router.use(authenticateToken);

router.get('/', usersController.getAllUsers);

export default router;
