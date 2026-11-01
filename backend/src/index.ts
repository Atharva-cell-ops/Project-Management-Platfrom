import http from 'http';
import { createApp } from './app';
import { initializeSocket } from './socket';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';
import { ensureDemoUsersSeeded } from './utils/seedDemo';

const startServer = async () => {
  // Ensure demo accounts exist on boot
  await ensureDemoUsersSeeded(prisma);

  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.io
  initializeSocket(server);

  server.listen(config.port, () => {
    logger.info(`🚀 FLOWBOARD Server running on port ${config.port} (${config.nodeEnv})`);
    logger.info(`📡 API endpoint: http://localhost:${config.port}/api`);
    logger.info(`🔌 Socket.io ready for connections on ws://localhost:${config.port}`);
  });

  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('HTTP & Socket server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
