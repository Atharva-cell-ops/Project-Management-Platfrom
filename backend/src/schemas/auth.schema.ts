import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be under 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  bio: z.string().max(250, 'Bio must be under 250 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(250).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});
