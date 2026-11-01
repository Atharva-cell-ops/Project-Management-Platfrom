import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(60, 'Project name is too long'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  key: z
    .string()
    .min(2, 'Key must be 2-6 uppercase letters')
    .max(6, 'Key must be 2-6 uppercase letters')
    .regex(/^[A-Z0-9]+$/, 'Key must contain only uppercase alphanumeric characters')
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(500).optional(),
  isArchived: z.boolean().optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Please enter a valid member email address'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});
