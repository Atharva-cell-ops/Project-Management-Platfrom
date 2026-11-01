import { prisma } from '../utils/prisma';
import { getSocketServer } from '../socket';

export const logActivity = async ({
  projectId,
  userId,
  action,
  details,
  taskId,
}: {
  projectId: string;
  userId: string;
  action: string;
  details?: Record<string, any>;
  taskId?: string;
}) => {
  try {
    const activity = await prisma.activity.create({
      data: {
        projectId,
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
        taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Broadcast to project room
    const io = getSocketServer();
    if (io) {
      io.to(`project:${projectId}`).emit('activity:logged', activity);
    }

    return activity;
  } catch (err) {
    console.error('Error logging activity:', err);
    return null;
  }
};
