import { Request, Response } from 'express';

/** Catch-all 404 for unmatched routes. Registered after every real route. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
}
