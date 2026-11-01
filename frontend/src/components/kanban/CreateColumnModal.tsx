import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Column, ApiResponse } from '../../types';

const columnSchema = z.object({
  title: z.string().min(1, 'Column title is required').max(50),
});

type ColumnFormValues = z.infer<typeof columnSchema>;

export interface CreateColumnModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onColumnCreated: (column: Column) => void;
}

export const CreateColumnModal: React.FC<CreateColumnModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onColumnCreated,
}) => {
  const { success, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ColumnFormValues>({
    resolver: zodResolver(columnSchema),
    defaultValues: { title: '' },
  });

  const onSubmit = async (values: ColumnFormValues) => {
    try {
      const res = await apiClient.post<ApiResponse<Column>>(
        `/projects/${projectId}/columns`,
        values
      );

      if (res.data.success) {
        success('Column added successfully!');
        reset();
        onClose();
        onColumnCreated(res.data.data);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to create column.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Column"
      description="Create a new stage for your project board workflow."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Column Title"
          placeholder="e.g. QA Testing / Staging"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add Column
          </Button>
        </div>
      </form>
    </Modal>
  );
};
