import cors from 'cors';
import express, { Express } from 'express';
import config from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import userRoutes from './routes/userRoutes';

/** Builds the Express app without listening, so tests can call it directly. */
export function createApp({ logRequests = true } = {}): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigin }));
  if (logRequests) app.use(requestLogger);

  app.get('/', (_req, res) => {
    res.json({
      name: 'Presight User Directory API',
      version: '1.0.0',
      endpoints: { users: '/api/users', facets: '/api/users/facets', health: '/api/health' },
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/users', userRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
