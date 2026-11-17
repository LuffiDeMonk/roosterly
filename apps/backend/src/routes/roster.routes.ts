import { Router } from 'express';
import {
  getWeekRoster,
  saveDraftAssignments,
  publishRoster,
  setSingleAssignment,
  removeAssignment,
  saveDraftAssignmentsSchema,
  updateAssignmentSchema,
} from '../controllers/roster.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { requireTeamRole } from '../middleware/tenant.js';

const router = Router();

router.use(requireAuth);

router.get('/week', getWeekRoster);
router.post(
  '/draft',
  requireTeamRole(['ADMIN', 'SUPERVISOR']),
  validateBody(saveDraftAssignmentsSchema),
  saveDraftAssignments
);
router.post(
  '/:id/publish',
  requireTeamRole(['ADMIN', 'SUPERVISOR']),
  publishRoster
);
router.post(
  '/assignments',
  requireTeamRole(['ADMIN', 'SUPERVISOR']),
  validateBody(updateAssignmentSchema),
  setSingleAssignment
);
router.delete(
  '/assignments/:assignmentId',
  requireTeamRole(['ADMIN', 'SUPERVISOR']),
  removeAssignment
);

export default router;
