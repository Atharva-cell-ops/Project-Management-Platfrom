import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class ActivityController {
  static async getProjectActivities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const activities = await prisma.activity.findMany({
        where: { projectId: req.params.id },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          task: {
            select: { id: true, title: true },
          },
        },
      });
      return sendSuccess(res, activities);
    } catch (err) {
      next(err);
    }
  }
}
