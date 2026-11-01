import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { ApiResponse, Project } from '../../types';

const projectFormSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(60),
  description: z.string().max(500).optional(),
  key: z
    .string()
    .min(2, 'Key must be 2-6 letters')
    .max(6, 'Key must be 2-6 letters')
    .regex(/^[A-Za-z0-9]+$/, 'Letters and numbers only')
    .optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      key: '',
    },
  });

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      const res = await apiClient.post<ApiResponse<Project>>('/projects', {
        ...values,
        key: values.key ? values.key.toUpperCase() : undefined,
      });

      if (res.data.success) {
        success('Project created successfully with default Kanban columns!');
        reset();
        onClose();
        if (onSuccess) {
          onSuccess(res.data.data);
        } else {
          navigate(`/projects/${res.data.data.id}/board`);
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to create project.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Start a collaborative workspace with Kanban board and team tracking."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="e.g. Mobile App Redesign"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Project Key (Prefix)"
          placeholder="e.g. MOBI (Auto-generated if empty)"
          helperText="Used as a unique shorthand prefix for task cards (2-6 letters)."
          error={errors.key?.message}
          {...register('key')}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Brief summary of the project goals, milestones, and scope..."
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
