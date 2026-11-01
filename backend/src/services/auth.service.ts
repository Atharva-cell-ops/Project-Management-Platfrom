import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string;
    bio?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        avatarUrl: data.avatarUrl || null,
        bio: data.bio || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return { user, token };
  }

  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await comparePassword(data.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            memberships: true,
            assignedTasks: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return user;
  }

  static async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatarUrl?: string;
      bio?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.bio !== undefined) updateData.bio = data.bio;

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new Error('Current password is required to set a new password.');
      }
      const isMatch = await comparePassword(data.currentPassword, user.password);
      if (!isMatch) {
        throw new Error('Current password is incorrect.');
      }
      updateData.password = await hashPassword(data.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}
