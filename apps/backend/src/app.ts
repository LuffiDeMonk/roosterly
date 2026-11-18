import express, { type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';

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
app.use(cookieParser());

// Mount API router
// Mount on '/api/v1', '/api', and '/' to seamlessly support Vercel serverless proxying and local dev
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

export default app;
