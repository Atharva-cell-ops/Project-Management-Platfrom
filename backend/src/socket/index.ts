import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { config } from '../config';

let io: SocketIOServer | null = null;

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1] ||
      socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      logger.warn(`Socket connection rejected: No authentication token provided. Socket ID: ${socket.id}`);
      return next(); // Allow connection but without user context for public heartbeat
    }

    try {
      const decoded = verifyToken(token);
      (socket as any).user = decoded;
      next();
    } catch (err: any) {
      logger.warn(`Socket authentication failed: ${err.message}. Socket ID: ${socket.id}`);
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`Socket connected: ${socket.id} (User: ${user ? user.email : 'Anonymous'})`);

    // Join a specific project workspace room
    socket.on('join_project', (projectId: string) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
        logger.debug(`Socket ${socket.id} joined project:${projectId}`);
      }
    });

    // Leave a specific project workspace room
    socket.on('leave_project', (projectId: string) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
        logger.debug(`Socket ${socket.id} left project:${projectId}`);
      }
    });

    // Handle client disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}. Reason: ${reason}`);
    });

    // Handle socket errors
    socket.on('error', (err) => {
      logger.error(`Socket error on ${socket.id}:`, err);
    });
  });

  return io;
};

export const getSocketServer = (): SocketIOServer | null => {
  return io;
};
