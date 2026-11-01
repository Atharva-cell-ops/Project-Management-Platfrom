import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskPriority, ProjectRole } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-medium tracking-wide',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  const variantStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700',
    primary: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 rounded-full border transition-colors',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  const config = {
    LOW: { label: 'Low', variant: 'default' as const, dot: 'bg-slate-400' },
    MEDIUM: { label: 'Medium', variant: 'primary' as const, dot: 'bg-indigo-500' },
    HIGH: { label: 'High', variant: 'warning' as const, dot: 'bg-amber-500' },
    URGENT: { label: 'Urgent', variant: 'danger' as const, dot: 'bg-rose-500 animate-pulse' },
  };

  const item = config[priority] || config.MEDIUM;

  return (
    <Badge variant={item.variant} size={size}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', item.dot)} />
      {item.label}
    </Badge>
  );
};

export const RoleBadge: React.FC<{ role: ProjectRole; size?: 'sm' | 'md' }> = ({
  role,
  size = 'sm',
}) => {
  const config = {
    OWNER: { label: 'Owner', variant: 'primary' as const },
    ADMIN: { label: 'Admin', variant: 'warning' as const },
    MEMBER: { label: 'Member', variant: 'default' as const },
  };

  const item = config[role] || config.MEMBER;

  return (
    <Badge variant={item.variant} size={size}>
      {item.label}
    </Badge>
  );
};
