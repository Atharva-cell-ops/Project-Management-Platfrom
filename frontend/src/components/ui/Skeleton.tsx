import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80',
          className
        )
      )}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-16 h-5 rounded-full" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-5 rounded-md" />
      <Skeleton className="w-full h-4 rounded-md" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="w-20 h-4 rounded-md" />
        <div className="flex -space-x-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const KanbanBoardSkeleton: React.FC = () => {
  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-80 shrink-0 bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl p-4 space-y-4 border border-slate-200/60 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-28 h-6 rounded-md" />
            <Skeleton className="w-8 h-6 rounded-full" />
          </div>
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-4 rounded-md" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
          <Skeleton className="w-20 h-8 rounded-md" />
          <Skeleton className="w-32 h-3 rounded-md" />
        </div>
      ))}
    </div>
  );
};
