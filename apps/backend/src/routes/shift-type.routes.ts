import { Router } from 'express';
import {
  getShiftTypes,
  createShiftType,
  updateShiftType,
  deleteShiftType,
  createShiftTypeSchema,
  updateShiftTypeSchema,
} from '../controllers/shift-type.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', getShiftTypes);
router.post('/', validateBody(createShiftTypeSchema), createShiftType);
router.put('/:id', validateBody(updateShiftTypeSchema), updateShiftType);
router.delete('/:id', deleteShiftType);

export default router;
