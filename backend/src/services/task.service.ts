import { prisma } from '../utils/prisma';
import { logActivity } from './activity.service';
import { getSocketServer } from '../socket';
import { TaskPriority } from '../types';

export class TaskService {
  static async getTasks(
    projectId: string,
    filters: {
      search?: string;
      priority?: string;
      assigneeId?: string;
      labelId?: string;
      columnId?: string;
    }
  ) {
    const where: any = {
      projectId,
      isArchived: false,
    };

    if (filters.columnId) {
      where.columnId = filters.columnId;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assigneeId) {
      where.assignees = {
        some: { userId: filters.assigneeId },
      };
    }

    if (filters.labelId) {
      where.labels = {
        some: { labelId: filters.labelId },
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return prisma.task.findMany({
      where,
      orderBy: [{ columnId: 'asc' }, { order: 'asc' }],
      include: {
        column: { select: { id: true, title: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        labels: {
          include: { label: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  static async getTaskById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, name: true, key: true },
        },
        column: {
          select: { id: true, title: true },
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        labels: {
          include: { label: true },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!task) throw new Error('Task not found.');
    return task;
  }

  static async createTask(
    projectId: string,
    creatorId: string,
    data: {
      columnId: string;
      title: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: string | null;
      assigneeIds?: string[];
      labelIds?: string[];
    }
  ) {
    // Find highest order in target column
    const highestOrderTask = await prisma.task.findFirst({
      where: { columnId: data.columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        projectId,
        columnId: data.columnId,
        creatorId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority || 'MEDIUM',
        order: newOrder,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignees: data.assigneeIds?.length
          ? {
              create: data.assigneeIds.map((userId) => ({ userId })),
            }
          : undefined,
        labels: data.labelIds?.length
          ? {
              create: data.labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
      },
      include: {
        column: { select: { id: true, title: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        labels: {
          include: { label: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId: creatorId,
      taskId: task.id,
      action: 'TASK_CREATED',
      details: { title: task.title, priority: task.priority, columnTitle: task.column.title },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`project:${projectId}`).emit('task:created', task);
    }

    return task;
  }

  static async updateTask(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string | null;
      priority?: TaskPriority;
      dueDate?: string | null;
      isArchived?: boolean;
      columnId?: string;
      order?: number;
    }
  ) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!existing) throw new Error('Task not found.');

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.description !== undefined)
      updatePayload.description = data.description ? data.description.trim() : null;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.dueDate !== undefined)
      updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.isArchived !== undefined) updatePayload.isArchived = data.isArchived;
    if (data.columnId !== undefined) updatePayload.columnId = data.columnId;
    if (data.order !== undefined) updatePayload.order = data.order;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updatePayload,
      include: {
        column: { select: { id: true, title: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        labels: {
          include: { label: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    await logActivity({
      projectId: existing.projectId,
      userId,
      taskId,
      action: 'TASK_UPDATED',
      details: {
        changes: Object.keys(data),
      },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`project:${existing.projectId}`).emit('task:updated', task);
    }

    return task;
  }

  static async moveTask(
    taskId: string,
    userId: string,
    targetColumnId: string,
    newOrder: number
  ) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!existing) throw new Error('Task not found.');

    const isColumnChanged = existing.columnId !== targetColumnId;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: targetColumnId,
        order: newOrder,
      },
      include: {
        column: { select: { id: true, title: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        labels: {
          include: { label: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (isColumnChanged) {
      const targetColumn = await prisma.column.findUnique({
        where: { id: targetColumnId },
        select: { title: true },
      });

      await logActivity({
        projectId: existing.projectId,
        userId,
        taskId,
        action: 'TASK_MOVED',
        details: {
          fromColumn: existing.column.title,
          toColumn: targetColumn?.title || 'Unknown Column',
        },
      });
    }

    const io = getSocketServer();
    if (io) {
      io.to(`project:${existing.projectId}`).emit('task:moved', {
        taskId,
        sourceColumnId: existing.columnId,
        targetColumnId,
        newOrder,
        task: updatedTask,
      });
    }

    return updatedTask;
  }

  static async deleteTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true, columnId: true, title: true },
    });

    if (!task) throw new Error('Task not found.');

    await prisma.task.delete({
      where: { id: taskId },
    });

    await logActivity({
      projectId: task.projectId,
      userId,
      action: 'TASK_DELETED',
      details: { title: task.title },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:deleted', {
        taskId,
        columnId: task.columnId,
      });
    }

    return { message: 'Task deleted successfully.' };
  }

  static async assignUser(taskId: string, userId: string, actorId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true },
    });
    if (!task) throw new Error('Task not found.');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    if (!user) throw new Error('User not found.');

    await prisma.taskAssignee.upsert({
      where: {
        taskId_userId: { taskId, userId },
      },
      update: {},
      create: { taskId, userId },
    });

    await logActivity({
      projectId: task.projectId,
      userId: actorId,
      taskId,
      action: 'TASK_ASSIGNED',
      details: { assignedUser: user.name },
    });

    const fullTask = await this.getTaskById(taskId);
    const io = getSocketServer();
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:updated', fullTask);
    }

    return fullTask;
  }

  static async unassignUser(taskId: string, userId: string, actorId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true },
    });
    if (!task) throw new Error('Task not found.');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await prisma.taskAssignee.deleteMany({
      where: { taskId, userId },
    });

    if (user) {
      await logActivity({
        projectId: task.projectId,
        userId: actorId,
        taskId,
        action: 'TASK_UNASSIGNED',
        details: { unassignedUser: user.name },
      });
    }

    const fullTask = await this.getTaskById(taskId);
    const io = getSocketServer();
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:updated', fullTask);
    }

    return fullTask;
  }

  static async attachLabel(taskId: string, labelId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) throw new Error('Task not found.');

    await prisma.taskLabel.upsert({
      where: {
        taskId_labelId: { taskId, labelId },
      },
      update: {},
      create: { taskId, labelId },
    });

    const fullTask = await this.getTaskById(taskId);
    const io = getSocketServer();
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:updated', fullTask);
    }

    return fullTask;
  }

  static async detachLabel(taskId: string, labelId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) throw new Error('Task not found.');

    await prisma.taskLabel.deleteMany({
      where: { taskId, labelId },
    });

    const fullTask = await this.getTaskById(taskId);
    const io = getSocketServer();
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:updated', fullTask);
    }

    return fullTask;
  }
}
