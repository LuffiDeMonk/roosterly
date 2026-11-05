import type { Request, Response } from 'express';
import app from '../apps/backend/src/app.js';
import connectDB from '../apps/backend/src/db/index.js';

export default async function handler(req: Request, res: Response) {
  await connectDB();
  return app(req, res);
}
