import { z } from 'zod';

export const createTaskSchema = z.object({
  columnId: z.string().min(1, 'Column ID is required'),
  title: z.string().min(1, 'Task title is required').max(150, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().nullable().optional().or(z.literal('')),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().nullable().optional().or(z.literal('')),
  isArchived: z.boolean().optional(),
  columnId: z.string().optional(),
  order: z.number().optional(),
});

export const moveTaskSchema = z.object({
  targetColumnId: z.string().min(1, 'Target column ID is required'),
  newOrder: z.number(),
});

export const createColumnSchema = z.object({
  title: z.string().min(1, 'Column title is required').max(50, 'Column title is too long'),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1).max(50).optional(),
  order: z.number().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment is too long'),
});

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(30, 'Label name is too long'),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color code'),
});
