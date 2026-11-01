import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Shield } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';
import { ApiResponse, User as UserType } from '../types';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  bio: z.string().max(250).optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || '',
      bio: user?.bio || '',
      currentPassword: '',
      newPassword: '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const payload: any = {
        name: values.name.trim(),
        avatarUrl: values.avatarUrl || null,
        bio: values.bio || null,
      };

      if (values.newPassword && values.currentPassword) {
        payload.currentPassword = values.currentPassword;
        payload.newPassword = values.newPassword;
      }

      const res = await apiClient.patch<ApiResponse<UserType>>('/auth/profile', payload);
      if (res.data.success && res.data.data) {
        updateUser(res.data.data);
        success('Profile updated successfully!');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile.');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Account Profile & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, avatar, and security credentials.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        {/* User Avatar Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <Avatar name={user.name} src={user.avatarUrl} size="xl" />
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {user.name}
            </h3>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Avatar Image URL (Optional)"
            placeholder="https://images.unsplash.com/..."
            error={errors.avatarUrl?.message}
            helperText="Provide a public URL to your portrait image or leave blank for initials."
            {...register('avatarUrl')}
          />

          <Textarea
            label="Bio"
            placeholder="Tell your team about your role, skills, or timezone..."
            error={errors.bio?.message}
            {...register('bio')}
          />

          {/* Change Password Section */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" /> Security & Password
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="Required to set new password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 6 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" isLoading={isSubmitting}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
