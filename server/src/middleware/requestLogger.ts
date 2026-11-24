import { NextFunction, Request, Response } from 'express';

const RESET = '\x1b[0m';

function colorFor(status: number): string {
  if (status >= 500) return '\x1b[31m';
  if (status >= 400) return '\x1b[33m';
  return '\x1b[32m';
}

/** Logs one line per request: [METHOD] /path → status (Xms) */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const color = colorFor(res.statusCode);
    console.log(
      `${color}[${req.method}]${RESET} ${req.originalUrl} → ${color}${res.statusCode}${RESET} (${Date.now() - start}ms)`,
    );
  });

  next();
}
