import { Router } from 'express';
import {
  createTeam,
  joinTeam,
  getMyTeams,
  getTeamDetails,
  getTeamMembers,
  updateMemberStatus,
  createTeamSchema,
  joinTeamSchema,
  updateMemberStatusSchema,
} from '../controllers/team.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { requireTeamRole } from '../middleware/tenant.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMyTeams);
router.post('/', validateBody(createTeamSchema), createTeam);
router.post('/join', validateBody(joinTeamSchema), joinTeam);

router.get('/:teamId', getTeamDetails);
router.get('/:teamId/members', getTeamMembers);
router.patch(
  '/:teamId/members/:memberId',
  requireTeamRole(['ADMIN', 'SUPERVISOR']),
  validateBody(updateMemberStatusSchema),
  updateMemberStatus
);

export default router;
