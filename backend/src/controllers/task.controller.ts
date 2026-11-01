import { Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export class TaskController {
  static async getTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        priority: req.query.priority as string | undefined,
        assigneeId: req.query.assigneeId as string | undefined,
        labelId: req.query.labelId as string | undefined,
        columnId: req.query.columnId as string | undefined,
      };

      const tasks = await TaskService.getTasks(req.params.id, filters);
      return sendSuccess(res, tasks);
    } catch (err) {
      next(err);
    }
  }

  static async createTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const task = await TaskService.createTask(req.params.id, userId, req.body);
      return sendSuccess(res, task, 'Task created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getTaskById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.getTaskById(req.params.id);
      return sendSuccess(res, task);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return sendError(res, err.message, 404);
      }
      next(err);
    }
  }

  static async updateTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const task = await TaskService.updateTask(req.params.id, userId, req.body);
      return sendSuccess(res, task, 'Task updated successfully.');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return sendError(res, err.message, 404);
      }
      next(err);
    }
  }

  static async moveTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const { targetColumnId, newOrder } = req.body;
      const task = await TaskService.moveTask(req.params.id, userId, targetColumnId, newOrder);
      return sendSuccess(res, task, 'Task moved successfully.');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return sendError(res, err.message, 404);
      }
      next(err);
    }
  }

  static async deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const result = await TaskService.deleteTask(req.params.id, userId);
      return sendSuccess(res, result, 'Task deleted successfully.');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return sendError(res, err.message, 404);
      }
      next(err);
    }
  }

  static async assignUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.userId;
      if (!actorId) return sendError(res, 'Unauthorized', 401);

      const { userId } = req.body;
      if (!userId) return sendError(res, 'User ID is required.', 400);

      const task = await TaskService.assignUser(req.params.id, userId, actorId);
      return sendSuccess(res, task, 'User assigned to task.');
    } catch (err: any) {
      next(err);
    }
  }

  static async unassignUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.userId;
      if (!actorId) return sendError(res, 'Unauthorized', 401);

      const task = await TaskService.unassignUser(req.params.id, req.params.userId, actorId);
      return sendSuccess(res, task, 'User unassigned from task.');
    } catch (err: any) {
      next(err);
    }
  }

  static async attachLabel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { labelId } = req.body;
      if (!labelId) return sendError(res, 'Label ID is required.', 400);

      const task = await TaskService.attachLabel(req.params.id, labelId);
      return sendSuccess(res, task, 'Label attached to task.');
    } catch (err: any) {
      next(err);
    }
  }

  static async detachLabel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.detachLabel(req.params.id, req.params.labelId);
      return sendSuccess(res, task, 'Label detached from task.');
    } catch (err: any) {
      next(err);
    }
  }
}
