import { prisma } from '../utils/prisma';
import { logActivity } from './activity.service';

export class ProjectService {
  static async createProject(
    userId: string,
    data: { name: string; description?: string; key?: string }
  ) {
    const key =
      data.key?.toUpperCase() ||
      data.name
        .trim()
        .replace(/[^A-Za-z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase() ||
      'PRJ';

    const project = await prisma.project.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        key,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        columns: {
          create: [
            { title: 'To Do', order: 0 },
            { title: 'In Progress', order: 1 },
            { title: 'In Review', order: 2 },
            { title: 'Done', order: 3 },
          ],
        },
        labels: {
          create: [
            { name: 'Bug', color: '#EF4444' },
            { name: 'Feature', color: '#3B82F6' },
            { name: 'Enhancement', color: '#10B981' },
            { name: 'Design', color: '#8B5CF6' },
            { name: 'Documentation', color: '#F59E0B' },
          ],
        },
      },
      include: {
        columns: { orderBy: { order: 'asc' } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        labels: true,
      },
    });

    await logActivity({
      projectId: project.id,
      userId,
      action: 'PROJECT_CREATED',
      details: { name: project.name, key: project.key },
    });

    return project;
  }

  static async getUserProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
        isArchived: false,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Enrich with active & completed task counts
    const enrichedProjects = await Promise.all(
      projects.map(async (p) => {
        const completedTasksCount = await prisma.task.count({
          where: {
            projectId: p.id,
            column: { title: { equals: 'Done' } },
          },
        });
        return {
          ...p,
          completedTasksCount,
          activeTasksCount: p._count.tasks - completedTasksCount,
        };
      })
    );

    return enrichedProjects;
  }

  static async getProjectById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              where: { isArchived: false },
              orderBy: { order: 'asc' },
              include: {
                assignees: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, avatarUrl: true },
                    },
                  },
                },
                labels: {
                  include: {
                    label: true,
                  },
                },
                _count: {
                  select: {
                    comments: true,
                  },
                },
              },
            },
          },
        },
        labels: true,
      },
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    return project;
  }

  static async updateProject(
    projectId: string,
    userId: string,
    data: { name?: string; description?: string; isArchived?: boolean }
  ) {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.isArchived !== undefined ? { isArchived: data.isArchived } : {}),
      },
    });

    await logActivity({
      projectId,
      userId,
      action: 'PROJECT_UPDATED',
      details: data,
    });

    return project;
  }

  static async deleteProject(projectId: string) {
    return prisma.project.delete({
      where: { id: projectId },
    });
  }

  static async getProjectDashboard(projectId: string) {
    const now = new Date();

    const [
      project,
      totalTasks,
      completedTasks,
      urgentTasks,
      overdueTasks,
      membersCount,
      recentActivities,
      columns,
    ] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, description: true, key: true, createdAt: true },
      }),
      prisma.task.count({ where: { projectId, isArchived: false } }),
      prisma.task.count({
        where: { projectId, isArchived: false, column: { title: 'Done' } },
      }),
      prisma.task.count({
        where: { projectId, isArchived: false, priority: 'URGENT' },
      }),
      prisma.task.count({
        where: {
          projectId,
          isArchived: false,
          dueDate: { lt: now },
          column: { title: { not: 'Done' } },
        },
      }),
      prisma.projectMember.count({ where: { projectId } }),
      prisma.activity.findMany({
        where: { projectId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          task: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.column.findMany({
        where: { projectId },
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { tasks: { where: { isArchived: false } } },
          },
        },
      }),
    ]);

    if (!project) throw new Error('Project not found.');

    // Task distribution by priority
    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      where: { projectId, isArchived: false },
      _count: { _all: true },
    });

    const priorityBreakdown = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    priorityCounts.forEach((p) => {
      if (p.priority in priorityBreakdown) {
        priorityBreakdown[p.priority as keyof typeof priorityBreakdown] = p._count._all;
      }
    });

    return {
      project,
      metrics: {
        totalTasks,
        activeTasks: totalTasks - completedTasks,
        completedTasks,
        urgentTasks,
        overdueTasks,
        membersCount,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      columnsBreakdown: columns.map((col) => ({
        id: col.id,
        title: col.title,
        taskCount: col._count.tasks,
      })),
      priorityBreakdown,
      recentActivities,
    };
  }
}
