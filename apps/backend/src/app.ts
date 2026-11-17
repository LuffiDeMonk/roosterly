import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Main API Router
const router = express.Router();

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

// Mount router on both '/api' and '/'
// This ensures routes match whether accessed directly on port 5000 or routed via Vercel Serverless Function
app.use('/api', router);
app.use('/', router);

export default app;
