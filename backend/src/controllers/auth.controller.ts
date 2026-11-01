import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      return sendSuccess(res, result, 'User registered successfully.', 201);
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        return sendError(res, err.message, 409);
      }
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      return sendSuccess(res, result, 'Login successful.');
    } catch (err: any) {
      if (err.message.includes('Invalid email or password')) {
        return sendError(res, err.message, 401);
      }
      next(err);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'Unauthorized', 401);
      }
      const user = await AuthService.getProfile(req.user.userId);
      return sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'Unauthorized', 401);
      }
      const updated = await AuthService.updateProfile(req.user.userId, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully.');
    } catch (err: any) {
      if (err.message.includes('Current password')) {
        return sendError(res, err.message, 400);
      }
      next(err);
    }
  }
}
