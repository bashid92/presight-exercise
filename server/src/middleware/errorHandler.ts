import { NextFunction, Request, Response } from 'express';
import config from '../config/env';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Last middleware in the chain. Client errors (4xx) return their message;
 * server errors return a generic message and are logged.
 */
export function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction): void {
  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : err.message,
    ...(config.nodeEnv === 'development' && status >= 500 && { stack: err.stack }),
  });
}
