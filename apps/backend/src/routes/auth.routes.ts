import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, validateBody(updateProfileSchema), updateProfile);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), changePassword);

export default router;
