import { Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export class ProjectController {
  static async createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const project = await ProjectService.createProject(userId, req.body);
      return sendSuccess(res, project, 'Project created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const projects = await ProjectService.getUserProjects(userId);
      return sendSuccess(res, projects);
    } catch (err) {
      next(err);
    }
  }

  static async getProjectById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await ProjectService.getProjectById(req.params.id);
      return sendSuccess(res, project);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return sendError(res, err.message, 404);
      }
      next(err);
    }
  }

  static async updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const updated = await ProjectService.updateProject(req.params.id, userId, req.body);
      return sendSuccess(res, updated, 'Project updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  static async deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ProjectService.deleteProject(req.params.id);
      return sendSuccess(res, null, 'Project deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dashboardData = await ProjectService.getProjectDashboard(req.params.id);
      return sendSuccess(res, dashboardData);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return sendError(res, err.message, 404);
      }
      next(err);
    }
  }
}
