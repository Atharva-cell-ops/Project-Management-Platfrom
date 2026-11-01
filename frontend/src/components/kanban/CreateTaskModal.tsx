import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Column, ProjectMember, Label, Task, ApiResponse } from '../../types';

const taskFormSchema = z.object({
  columnId: z.string().min(1, 'Please select a column'),
  title: z.string().min(1, 'Task title is required').max(150),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface CreateTaskModalProps {
  projectId: string;
  defaultColumnId?: string;
  columns: Column[];
  members: ProjectMember[];
  labels: Label[];
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  projectId,
  defaultColumnId,
  columns,
  isOpen,
  onClose,
  onTaskCreated,
}) => {
  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      columnId: defaultColumnId || columns[0]?.id || '',
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
    },
  });

  React.useEffect(() => {
    if (defaultColumnId) {
      setValue('columnId', defaultColumnId);
    } else if (columns.length > 0) {
      setValue('columnId', columns[0].id);
    }
  }, [defaultColumnId, columns, setValue]);

  const onSubmit = async (values: TaskFormValues) => {
    try {
      const res = await apiClient.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, {
        columnId: values.columnId,
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        priority: values.priority,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      });

      if (res.data.success) {
        success('Task created successfully!');
        reset();
        onClose();
        onTaskCreated(res.data.data);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to create task.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add a new card to the project board."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Column / Status"
          options={columns.map((c) => ({ value: c.id, label: c.title }))}
          error={errors.columnId?.message}
          {...register('columnId')}
        />

        <Input
          label="Task Title"
          placeholder="e.g. Implement OAuth sign-in flow"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Priority"
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
            error={errors.priority?.message}
            {...register('priority')}
          />

          <Input
            label="Due Date (Optional)"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
        </div>

        <Textarea
          label="Description (Optional)"
          placeholder="Details, requirements, or steps to complete..."
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
