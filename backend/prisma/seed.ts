import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FLOWBOARD database with portfolio-grade demo data...');

  // Clean existing records in reverse dependency order
  await prisma.activity.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskLabel.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.label.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const alex = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@flowboard.dev',
      password: passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Lead Full-Stack Engineer & Product Architect',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Chen',
      email: 'sarah@flowboard.dev',
      password: passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'Senior Frontend Developer & UI/UX Specialist',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: 'Marcus Johnson',
      email: 'marcus@flowboard.dev',
      password: passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Backend Infrastructure & Distributed Systems Engineer',
    },
  });

  const elena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena@flowboard.dev',
      password: passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Product Designer & Design Systems Lead',
    },
  });

  console.log('✅ Created 4 demo users (password: Password123!)');

  // 2. Create Project 1: "Flowboard Web Platform"
  const project1 = await prisma.project.create({
    data: {
      name: 'Flowboard Web Platform',
      description: 'Next-generation collaborative project management application with real-time sync.',
      key: 'FLOW',
      ownerId: alex.id,
      members: {
        create: [
          { userId: alex.id, role: 'OWNER' },
          { userId: sarah.id, role: 'ADMIN' },
          { userId: marcus.id, role: 'MEMBER' },
          { userId: elena.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create Labels for Project 1
  const labelBug = await prisma.label.create({
    data: { projectId: project1.id, name: 'Bug', color: '#EF4444' },
  });
  const labelFeature = await prisma.label.create({
    data: { projectId: project1.id, name: 'Feature', color: '#3B82F6' },
  });
  const labelDesign = await prisma.label.create({
    data: { projectId: project1.id, name: 'Design', color: '#8B5CF6' },
  });
  const labelHighPriority = await prisma.label.create({
    data: { projectId: project1.id, name: 'Urgent', color: '#F97316' },
  });
  const labelEnhancement = await prisma.label.create({
    data: { projectId: project1.id, name: 'Enhancement', color: '#10B981' },
  });

  // Create Columns for Project 1
  const colTodo = await prisma.column.create({
    data: { projectId: project1.id, title: 'To Do', order: 0 },
  });
  const colInProgress = await prisma.column.create({
    data: { projectId: project1.id, title: 'In Progress', order: 1 },
  });
  const colInReview = await prisma.column.create({
    data: { projectId: project1.id, title: 'In Review', order: 2 },
  });
  const colDone = await prisma.column.create({
    data: { projectId: project1.id, title: 'Done', order: 3 },
  });

  // Create Tasks for Project 1
  // To Do Tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      columnId: colTodo.id,
      creatorId: alex.id,
      title: 'Implement Dark/Light Theme Switching',
      description: 'Add a persistent theme switcher utilizing CSS custom variables and Tailwind dark mode classes.',
      priority: 'MEDIUM',
      order: 0,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assignees: { create: [{ userId: sarah.id }] },
      labels: { create: [{ labelId: labelFeature.id }, { labelId: labelDesign.id }] },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      columnId: colTodo.id,
      creatorId: marcus.id,
      title: 'Configure Express Rate Limiter and Helmet Headers',
      description: 'Harden API security with security headers, CORS origin verification, and rate limiting on /api/auth endpoints.',
      priority: 'HIGH',
      order: 1,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assignees: { create: [{ userId: marcus.id }] },
      labels: { create: [{ labelId: labelEnhancement.id }] },
    },
  });

  // In Progress Tasks
  const task3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      columnId: colInProgress.id,
      creatorId: alex.id,
      title: 'Build Kanban Board with Drag & Drop Reordering',
      description: 'Implement drag-and-drop interaction across columns and inside lists with TanStack Query optimistic updates.',
      priority: 'URGENT',
      order: 0,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignees: { create: [{ userId: alex.id }, { userId: sarah.id }] },
      labels: { create: [{ labelId: labelFeature.id }, { labelId: labelHighPriority.id }] },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: project1.id,
      columnId: colInProgress.id,
      creatorId: elena.id,
      title: 'Refine Task Details Modal & Activity Stream',
      description: 'Craft a clean drawer/modal displaying assignee avatars, label selector, interactive comments, and real-time audit logs.',
      priority: 'MEDIUM',
      order: 1,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      assignees: { create: [{ userId: elena.id }] },
      labels: { create: [{ labelId: labelDesign.id }] },
    },
  });

  // In Review Tasks
  const task5 = await prisma.task.create({
    data: {
      projectId: project1.id,
      columnId: colInReview.id,
      creatorId: marcus.id,
      title: 'Socket.io Real-Time Synchronization Gateway',
      description: 'Ensure project room broadcasts sync card movements, comment updates, and member activities instantly.',
      priority: 'HIGH',
      order: 0,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      assignees: { create: [{ userId: marcus.id }, { userId: alex.id }] },
      labels: { create: [{ labelId: labelFeature.id }] },
    },
  });

  // Done Tasks
  const task6 = await prisma.task.create({
    data: {
      projectId: project1.id,
      columnId: colDone.id,
      creatorId: alex.id,
      title: 'Design PostgreSQL Relational Schema with Prisma ORM',
      description: 'Architect models with foreign keys, indexes, cascades, and constraints for Users, Projects, Members, Columns, Tasks, Comments, and Activities.',
      priority: 'HIGH',
      order: 0,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      assignees: { create: [{ userId: alex.id }] },
      labels: { create: [{ labelId: labelEnhancement.id }] },
    },
  });

  // Comments for Task 3
  await prisma.comment.create({
    data: {
      taskId: task3.id,
      userId: sarah.id,
      content: 'Tested the drag and drop across column boundaries. It is silky smooth with optimistic updates!',
    },
  });
  await prisma.comment.create({
    data: {
      taskId: task3.id,
      userId: alex.id,
      content: 'Great work! Let us connect Socket.io to broadcast the new order positions to other connected users.',
    },
  });

  // Comments for Task 4
  await prisma.comment.create({
    data: {
      taskId: task4.id,
      userId: elena.id,
      content: 'Uploaded the latest Figma component designs for the activity audit trail timeline.',
    },
  });

  // Activities for Project 1
  await prisma.activity.createMany({
    data: [
      {
        projectId: project1.id,
        userId: alex.id,
        action: 'PROJECT_CREATED',
        details: JSON.stringify({ name: project1.name, key: project1.key }),
      },
      {
        projectId: project1.id,
        userId: alex.id,
        taskId: task3.id,
        action: 'TASK_CREATED',
        details: JSON.stringify({ title: task3.title, priority: task3.priority }),
      },
      {
        projectId: project1.id,
        userId: sarah.id,
        taskId: task3.id,
        action: 'COMMENT_ADDED',
        details: JSON.stringify({ taskTitle: task3.title }),
      },
      {
        projectId: project1.id,
        userId: marcus.id,
        taskId: task5.id,
        action: 'TASK_MOVED',
        details: JSON.stringify({ fromColumn: 'In Progress', toColumn: 'In Review' }),
      },
      {
        projectId: project1.id,
        userId: alex.id,
        taskId: task6.id,
        action: 'TASK_MOVED',
        details: JSON.stringify({ fromColumn: 'In Review', toColumn: 'Done' }),
      },
    ],
  });

  // 3. Create Project 2: "Mobile Client Experience"
  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile Client Experience',
      description: 'Responsive mobile-first experience with offline sync and push notifications.',
      key: 'MOBI',
      ownerId: sarah.id,
      members: {
        create: [
          { userId: sarah.id, role: 'OWNER' },
          { userId: alex.id, role: 'ADMIN' },
          { userId: elena.id, role: 'MEMBER' },
        ],
      },
      columns: {
        create: [
          { title: 'Backlog', order: 0 },
          { title: 'In Progress', order: 1 },
          { title: 'Completed', order: 2 },
        ],
      },
    },
  });

  console.log('✅ Created 2 full projects with columns, tasks, comments, and activities.');
  console.log('🚀 Seed data complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
