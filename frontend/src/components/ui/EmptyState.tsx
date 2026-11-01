import React from 'react';
import { FolderKanban, Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 ring-8 ring-indigo-50/50 dark:ring-indigo-950/20">
        {icon || <FolderKanban className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} leftIcon={<Sparkles className="w-4 h-4" />}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
