import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { apiRoutes } from './routes';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));

  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.originalUrl }, 'request received');
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', environment: env.NODE_ENV });
  });

  app.use('/api', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
