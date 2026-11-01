import React, { useState } from 'react';
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { Column, Task } from '../../types';
import { TaskCard } from './TaskCard';

export interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onRenameColumn?: (columnId: string, newTitle: string) => void;
  onDropTask: (taskId: string, targetColumnId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  onDeleteColumn,
  onRenameColumn,
  onDropTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(column.title);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && data.taskId) {
        onDropTask(data.taskId, column.id);
      }
    } catch (err) {
      console.error('Error parsing drop data:', err);
    }
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleText.trim() && titleText !== column.title && onRenameColumn) {
      onRenameColumn(column.id, titleText.trim());
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-80 shrink-0 bg-slate-100/70 dark:bg-slate-900/40 rounded-3xl p-4 border transition-all duration-200 ${
        isDragOver
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20'
          : 'border-slate-200/70 dark:border-slate-800'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              className="px-2 py-1 text-sm font-bold rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          ) : (
            <h3
              onClick={() => onRenameColumn && setIsEditingTitle(true)}
              className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {column.title}
            </h3>
          )}
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            onClick={() => onAddTask(column.id)}
            title="Add task to column"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>

          {(onRenameColumn || onDeleteColumn) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-20 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {onRenameColumn && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditingTitle(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Rename
                    </button>
                  )}
                  {onDeleteColumn && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteColumn(column.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Column
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[140px] pr-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}

        {tasks.length === 0 && (
          <div className="h-28 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400 font-medium select-none">
            No tasks in this list
          </div>
        )}
      </div>

      {/* Quick Add Task Button */}
      <button
        onClick={() => onAddTask(column.id)}
        className="mt-3 w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Card
      </button>
    </div>
  );
};
