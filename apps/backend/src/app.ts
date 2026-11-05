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
    message: 'Hab-Track backend running',
    timestamp: new Date().toISOString(),
  });
});

// Mount router on both '/api' and '/'
// This ensures routes match whether accessed directly on port 5000 or routed via Vercel Serverless Function
app.use('/api', router);
app.use('/', router);

export default app;
