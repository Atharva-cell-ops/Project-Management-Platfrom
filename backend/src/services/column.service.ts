import { prisma } from '../utils/prisma';
import { getSocketServer } from '../socket';

export class ColumnService {
  static async getColumns(projectId: string) {
    return prisma.column.findMany({
      where: { projectId },
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
              select: { comments: true },
            },
          },
        },
      },
    });
  }

  static async createColumn(projectId: string, title: string) {
    const highestOrderColumn = await prisma.column.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = highestOrderColumn ? highestOrderColumn.order + 1 : 0;

    const column = await prisma.column.create({
      data: {
        projectId,
        title: title.trim(),
        order: newOrder,
      },
      include: {
        tasks: true,
      },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`project:${projectId}`).emit('column:created', column);
    }

    return column;
  }

  static async updateColumn(columnId: string, data: { title?: string; order?: number }) {
    const column = await prisma.column.update({
      where: { id: columnId },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
      },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`project:${column.projectId}`).emit('column:updated', column);
    }

    return column;
  }

  static async deleteColumn(columnId: string) {
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    if (!column) throw new Error('Column not found.');

    if (column._count.tasks > 0) {
      throw new Error(
        'Cannot delete a column that contains tasks. Please move or delete tasks first.'
      );
    }

    await prisma.column.delete({
      where: { id: columnId },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`project:${column.projectId}`).emit('column:deleted', { columnId, projectId: column.projectId });
    }

    return { message: 'Column deleted successfully.' };
  }
}
