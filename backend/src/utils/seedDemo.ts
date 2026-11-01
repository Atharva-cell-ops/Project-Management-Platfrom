import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

export const ensureDemoUsersSeeded = async (prisma: PrismaClient) => {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 1) {
      // Demo users already populated
      return;
    }

    logger.info('🌱 Seeding demo accounts into database...');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const demoUsers = [
      {
        name: 'Alex Rivera',
        email: 'alex@flowboard.dev',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Lead Full-Stack Engineer & Product Architect',
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@flowboard.dev',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        bio: 'Senior Frontend Developer & UI/UX Specialist',
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus@flowboard.dev',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Backend Infrastructure & Distributed Systems Engineer',
      },
      {
        name: 'Elena Rostova',
        email: 'elena@flowboard.dev',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        bio: 'Principal Product Designer & UX Strategist',
      },
    ];

    for (const u of demoUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { password: passwordHash },
        create: {
          name: u.name,
          email: u.email,
          password: passwordHash,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
        },
      });
    }

    logger.info('✅ Demo accounts seeded successfully!');
  } catch (err: any) {
    logger.warn('Failed to seed demo accounts:', err.message);
  }
};

