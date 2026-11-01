import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  logger.error('Unhandled Exception:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'Unauthorized access.', 401);
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected server error occurred.'
      : err.message || 'Internal server error';

  return sendError(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
