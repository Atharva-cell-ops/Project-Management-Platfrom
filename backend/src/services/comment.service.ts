import { prisma } from '../utils/prisma';
import { logActivity } from './activity.service';
import { getSocketServer } from '../socket';

export class CommentService {
  static async getComments(taskId: string) {
    return prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  static async createComment(taskId: string, userId: string, content: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true },
    });

    if (!task) throw new Error('Task not found.');

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await logActivity({
      projectId: task.projectId,
      userId,
      taskId,
      action: 'COMMENT_ADDED',
      details: { taskTitle: task.title },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`project:${task.projectId}`).emit('comment:added', {
        taskId,
        comment,
      });
    }

    return comment;
  }

  static async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: { select: { projectId: true } },
      },
    });

    if (!comment) throw new Error('Comment not found.');
    if (comment.userId !== userId) {
      throw new Error('You can only delete your own comments.');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`project:${comment.task.projectId}`).emit('comment:deleted', {
        taskId: comment.taskId,
        commentId,
      });
    }

    return { message: 'Comment deleted successfully.' };
  }
}
