import { Router, type Request, type Response } from 'express';
import authRoutes from './auth.routes.js';
import teamRoutes from './team.routes.js';
import shiftTypeRoutes from './shift-type.routes.js';
import rosterRoutes from './roster.routes.js';
import swapRoutes from './swap.routes.js';
import inchargeRoutes from './incharge.routes.js';

const router = Router();

// Base health & info
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Roosterly API',
    message: 'Roosterly backend running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Roosterly API',
    timestamp: new Date().toISOString(),
  });
});

// Domain API routes
router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/shift-types', shiftTypeRoutes);
router.use('/rosters', rosterRoutes);
router.use('/swaps', swapRoutes);
router.use('/incharge', inchargeRoutes);

export default router;
