import React from 'react';
import { MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { Task } from '../../types';
import { PriorityBadge } from '../ui/Badge';
import { AvatarGroup } from '../ui/Avatar';

export interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDragStart }) => {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, sourceColumnId: task.columnId }));
        if (onDragStart) onDragStart(e, task);
      }}
      onClick={() => onClick(task)}
      className="group relative p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/80 transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top row: Priority & Labels */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <PriorityBadge priority={task.priority} size="sm" />

        {task.labels?.map(({ label }) => (
          <span
            key={label.id}
            style={{ backgroundColor: `${label.color}20`, color: label.color, borderColor: `${label.color}40` }}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
          >
            {label.name}
          </span>
        ))}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug mb-2">
        {task.title}
      </h4>

      {/* Description Snippet if present */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Card Footer: Due Date, Comments, Assignees */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
        <div className="flex items-center gap-2">
          {/* Due date badge */}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                isOverdue
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold'
                  : isDueToday
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isOverdue ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
          )}

          {/* Comment Count */}
          {(task.comments?.length || task._count?.comments || 0) > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{task.comments?.length || task._count?.comments || 0}</span>
            </div>
          )}
        </div>

        {/* Assignees Avatars */}
        {task.assignees && task.assignees.length > 0 && (
          <AvatarGroup
            users={task.assignees.map((a) => a.user)}
            max={3}
            size="xs"
          />
        )}
      </div>
    </div>
  );
};
