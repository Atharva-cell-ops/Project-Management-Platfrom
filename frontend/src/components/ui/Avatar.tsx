import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colorPalette = [
  'bg-indigo-500 text-white',
  'bg-violet-500 text-white',
  'bg-sky-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-fuchsia-500 text-white',
  'bg-teal-500 text-white',
];

const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getColorClass = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const [hasError, setHasError] = React.useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl font-semibold',
  };

  const initials = getInitials(name);
  const colorClass = getColorClass(name);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className={twMerge(
          clsx(
            'rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shrink-0',
            sizeClasses[size],
            className
          )
        )}
      />
    );
  }

  return (
    <div
      title={name}
      className={twMerge(
        clsx(
          'rounded-full flex items-center justify-center font-medium select-none ring-2 ring-white dark:ring-slate-900 shrink-0 shadow-xs',
          sizeClasses[size],
          colorClass,
          className
        )
      )}
    >
      {initials}
    </div>
  );
};

export const AvatarGroup: React.FC<{
  users: { id: string; name: string; avatarUrl?: string | null }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}> = ({ users, max = 3, size = 'xs' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  const sizeClass = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 text-xs',
  }[size];

  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {visible.map((u) => (
        <Avatar key={u.id} name={u.name} src={u.avatarUrl} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={`rounded-full flex items-center justify-center font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 ring-2 ring-white dark:ring-slate-900 select-none ${sizeClass}`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
