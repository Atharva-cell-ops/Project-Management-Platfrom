import { Response, NextFunction } from 'express';
import { AuthRequest, ProjectRole } from '../types';
import { prisma } from '../utils/prisma';
import { sendError } from '../utils/response';

const roleHierarchy: Record<ProjectRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const requireProjectRole = (requiredRole: ProjectRole = 'MEMBER') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Check projectId in params, query, or body
      let projectId = req.params.projectId || req.params.id;
      
      // If task ID is provided but no project ID, look up project ID via task
      if (!projectId && req.params.taskId) {
        const task = await prisma.task.findUnique({
          where: { id: req.params.taskId },
          select: { projectId: true },
        });
        if (task) {
          projectId = task.projectId;
        }
      }

      // If column ID is provided but no project ID, look up project ID via column
      if (!projectId && req.params.columnId) {
        const column = await prisma.column.findUnique({
          where: { id: req.params.columnId },
          select: { projectId: true },
        });
        if (column) {
          projectId = column.projectId;
        }
      }

      if (!projectId) {
        return sendError(res, 'Project identifier is required.', 400);
      }

      // Check if user is owner of the project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });

      if (!project) {
        return sendError(res, 'Project not found.', 404);
      }

      let userRole: ProjectRole | null = null;

      if (project.ownerId === userId) {
        userRole = 'OWNER';
      } else {
        const member = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId,
            },
          },
          select: { role: true },
        });

        if (member) {
          userRole = member.role as ProjectRole;
        }
      }

      if (!userRole) {
        return sendError(res, 'Access denied. You are not a member of this project.', 403);
      }

      if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
        return sendError(
          res,
          `Access denied. Requires ${requiredRole} permissions. Your role is ${userRole}.`,
          403
        );
      }

      req.projectRole = userRole;
      next();
    } catch (err) {
      console.error('RBAC error:', err);
      return sendError(res, 'Internal error verifying project authorization.', 500);
    }
  };
};
