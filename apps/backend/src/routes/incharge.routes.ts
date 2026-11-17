import { Router } from 'express';
import {
  getDailyStaffingCoverage,
  getPendingSupervisorActions,
} from '../controllers/incharge.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTeamRole } from '../middleware/tenant.js';

const router = Router();

router.use(requireAuth);

router.get('/coverage', getDailyStaffingCoverage);
router.get(
  '/pending-actions',
  requireTeamRole(['ADMIN', 'SUPERVISOR']),
  getPendingSupervisorActions
);

export default router;
