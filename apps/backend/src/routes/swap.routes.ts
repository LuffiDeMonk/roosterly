import { Router } from 'express';
import {
  getSwapRequests,
  createSwapRequest,
  acceptSwapRequest,
  reviewSwapRequest,
  cancelSwapRequest,
  createSwapSchema,
  acceptSwapSchema,
  reviewSwapSchema,
} from '../controllers/swap.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { requireTeamRole } from '../middleware/tenant.js';

const router = Router();

router.use(requireAuth);

router.get('/', getSwapRequests);
router.post('/', validateBody(createSwapSchema), createSwapRequest);
router.post('/:id/accept', validateBody(acceptSwapSchema), acceptSwapRequest);
router.post(
  '/:id/review',
  requireTeamRole(['ADMIN', 'SUPERVISOR']),
  validateBody(reviewSwapSchema),
  reviewSwapRequest
);
router.post('/:id/cancel', cancelSwapRequest);

export default router;
