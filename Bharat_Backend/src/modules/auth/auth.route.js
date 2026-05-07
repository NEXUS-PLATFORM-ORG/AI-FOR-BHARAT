import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from './auth.controller.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
});

router.post('/signup', authController.signup);
router.post('/login', loginLimiter, authController.login);
router.post('/google', loginLimiter, authController.googleLogin);

export default router;
