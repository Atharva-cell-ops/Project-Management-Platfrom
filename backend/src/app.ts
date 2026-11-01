import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { config } from './config';

export const createApp = (): Express => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logger
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root endpoint
  app.get('/', (_req, res) => {
    res.status(200).json({
      message: 'FLOWBOARD Backend Server is running.',
      api: '/api',
      health: '/api/health',
      client: config.clientUrl,
    });
  });

  // API Routes
  app.use('/api', routes);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
