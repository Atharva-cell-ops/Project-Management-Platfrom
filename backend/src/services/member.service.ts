import { prisma } from '../utils/prisma';
import { logActivity } from './activity.service';
import { ProjectRole } from '../types';

export class MemberService {
  static async getMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  static async addMember(
    projectId: string,
    operatorId: string,
    email: string,
    role: ProjectRole = 'MEMBER'
  ) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error(`No user found with email ${email}. They must create an account first.`);
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new Error('This user is already a member of the project.');
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
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

    await logActivity({
      projectId,
      userId: operatorId,
      action: 'MEMBER_ADDED',
      details: { memberName: user.name, memberEmail: user.email, role },
    });

    return member;
  }

  static async updateMemberRole(
    projectId: string,
    operatorId: string,
    targetUserId: string,
    role: ProjectRole
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (project?.ownerId === targetUserId && role !== 'OWNER') {
      throw new Error('Cannot change the role of the project owner.');
    }

    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId: operatorId,
      action: 'ROLE_UPDATED',
      details: { memberName: member.user.name, newRole: role },
    });

    return member;
  }

  static async removeMember(projectId: string, operatorId: string, targetUserId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (project?.ownerId === targetUserId) {
      throw new Error('Cannot remove the project owner.');
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!member) {
      throw new Error('Member not found in project.');
    }

    // Unassign user from all tasks in this project
    const projectTasks = await prisma.task.findMany({
      where: { projectId },
      select: { id: true },
    });

    const taskIds = projectTasks.map((t) => t.id);
    if (taskIds.length > 0) {
      await prisma.taskAssignee.deleteMany({
        where: {
          userId: targetUserId,
          taskId: { in: taskIds },
        },
      });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    await logActivity({
      projectId,
      userId: operatorId,
      action: 'MEMBER_REMOVED',
      details: { memberName: member.user.name, memberEmail: member.user.email },
    });

    return { message: 'Member successfully removed.' };
  }
}
