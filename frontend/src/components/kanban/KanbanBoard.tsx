import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Plus } from 'lucide-react';
import { Column, Task, ProjectMember, Label, ApiResponse } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { FilterBar, FilterState } from './FilterBar';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateColumnModal } from './CreateColumnModal';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../api/client';

export interface KanbanBoardProps {
  projectId: string;
  initialColumns: Column[];
  members: ProjectMember[];
  labels: Label[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  initialColumns,
  members,
  labels,
}) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [activeColumnForNewTask, setActiveColumnForNewTask] = useState<string>('');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: '',
    assigneeId: '',
    labelId: '',
  });

  const { socket, joinProject, leaveProject } = useSocket();
  const { error: toastError } = useToast();

  // Sync columns with initialColumns when props update
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Join project room for real-time events
  useEffect(() => {
    joinProject(projectId);
    return () => {
      leaveProject(projectId);
    };
  }, [projectId, joinProject, leaveProject]);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask: Task) => {
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === newTask.columnId) {
            const exists = col.tasks.some((t) => t.id === newTask.id);
            if (!exists) {
              return { ...col, tasks: [...col.tasks, newTask] };
            }
          }
          return col;
        })
      );
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
        }))
      );
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    };

    const handleTaskMoved = (data: {
      taskId: string;
      sourceColumnId: string;
      targetColumnId: string;
      newOrder: number;
      task: Task;
    }) => {
      setColumns((prev) => {
        let taskToMove = data.task;
        // Remove from all columns
        const cleaned = prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => {
            if (t.id === data.taskId) {
              taskToMove = { ...t, columnId: data.targetColumnId, order: data.newOrder };
              return false;
            }
            return true;
          }),
        }));

        // Add to target column
        return cleaned.map((col) => {
          if (col.id === data.targetColumnId) {
            return { ...col, tasks: [...col.tasks, taskToMove] };
          }
          return col;
        });
      });
    };

    const handleTaskDeleted = (data: { taskId: string; columnId: string }) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== data.taskId),
        }))
      );
      if (selectedTask?.id === data.taskId) {
        setIsTaskDetailOpen(false);
        setSelectedTask(null);
      }
    };

    const handleColumnCreated = (newCol: Column) => {
      setColumns((prev) => {
        const exists = prev.some((c) => c.id === newCol.id);
        return exists ? prev : [...prev, { ...newCol, tasks: [] }];
      });
    };

    const handleColumnUpdated = (updatedCol: Column) => {
      setColumns((prev) =>
        prev.map((c) => (c.id === updatedCol.id ? { ...c, title: updatedCol.title, order: updatedCol.order } : c))
      );
    };

    const handleColumnDeleted = (data: { columnId: string }) => {
      setColumns((prev) => prev.filter((c) => c.id !== data.columnId));
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('column:created', handleColumnCreated);
    socket.on('column:updated', handleColumnUpdated);
    socket.on('column:deleted', handleColumnDeleted);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('column:created', handleColumnCreated);
      socket.off('column:updated', handleColumnUpdated);
      socket.off('column:deleted', handleColumnDeleted);
    };
  }, [socket, selectedTask]);

  // Handle Drag & Drop move
  const handleDropTask = useCallback(
    async (taskId: string, targetColumnId: string) => {
      // Find current task
      let foundTask: Task | null = null;
      let sourceColId = '';

      for (const col of columns) {
        const t = col.tasks.find((item) => item.id === taskId);
        if (t) {
          foundTask = t;
          sourceColId = col.id;
          break;
        }
      }

      if (!foundTask || sourceColId === targetColumnId) return;

      const targetColumn = columns.find((c) => c.id === targetColumnId);
      const isCompleted = targetColumn?.title.toLowerCase().includes('done') || targetColumn?.title.toLowerCase().includes('complete');

      if (isCompleted) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Optimistic state update
      const previousColumns = [...columns];
      const targetColTasks = targetColumn ? targetColumn.tasks : [];
      const newOrder = targetColTasks.length;

      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === sourceColId) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
          }
          if (col.id === targetColumnId && foundTask) {
            return {
              ...col,
              tasks: [...col.tasks, { ...foundTask, columnId: targetColumnId, order: newOrder }],
            };
          }
          return col;
        })
      );

      // Persist to backend
      try {
        await apiClient.patch(`/tasks/${taskId}/move`, {
          targetColumnId,
          newOrder,
        });
      } catch (err: any) {
        // Rollback on failure
        setColumns(previousColumns);
        toastError('Failed to move task. Reverted changes.');
      }
    },
    [columns, toastError]
  );

  const handleOpenAddTask = (columnId: string) => {
    setActiveColumnForNewTask(columnId);
    setIsCreateTaskOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleRenameColumn = async (columnId: string, newTitle: string) => {
    try {
      const res = await apiClient.patch<ApiResponse<Column>>(
        `/projects/${projectId}/columns/${columnId}`,
        { title: newTitle }
      );
      if (res.data.success) {
        setColumns((prev) =>
          prev.map((c) => (c.id === columnId ? { ...c, title: newTitle } : c))
        );
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to rename column.');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!window.confirm('Are you sure you want to delete this column?')) return;
    try {
      const res = await apiClient.delete<ApiResponse<any>>(
        `/projects/${projectId}/columns/${columnId}`
      );
      if (res.data.success) {
        setColumns((prev) => prev.filter((c) => c.id !== columnId));
      }
    } catch (err: any) {
      toastError(err.message || 'Cannot delete column with tasks.');
    }
  };

  // Filter tasks per column
  const filteredColumns = useMemo(() => {
    return columns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
        // Search filter
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }

        // Priority filter
        if (filters.priority && task.priority !== filters.priority) {
          return false;
        }

        // Assignee filter
        if (filters.assigneeId) {
          const hasAssignee = task.assignees?.some((a) => a.userId === filters.assigneeId);
          if (!hasAssignee) return false;
        }

        // Label filter
        if (filters.labelId) {
          const hasLabel = task.labels?.some((l) => l.labelId === filters.labelId);
          if (!hasLabel) return false;
        }

        return true;
      });

      return {
        ...col,
        tasks: filteredTasks,
      };
    });
  }, [columns, filters]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        members={members}
        labels={labels}
      />

      {/* Columns Horizontal Scroll Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 items-start">
        {filteredColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={col.tasks}
            onTaskClick={handleTaskClick}
            onAddTask={handleOpenAddTask}
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
            onDropTask={handleDropTask}
          />
        ))}

        {/* Add Column Button */}
        <button
          onClick={() => setIsCreateColumnOpen(true)}
          className="w-80 shrink-0 h-40 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-sm transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span>Add New Column</span>
        </button>
      </div>

      {/* Task Details Modal */}
      <TaskDetailModal
        taskId={selectedTask?.id || null}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        members={members}
        labels={labels}
        onTaskUpdated={(updated) => {
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) => (t.id === updated.id ? updated : t)),
            }))
          );
        }}
        onTaskDeleted={(deletedId) => {
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t.id !== deletedId),
            }))
          );
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={projectId}
        defaultColumnId={activeColumnForNewTask}
        columns={columns}
        members={members}
        labels={labels}
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={(newTask) => {
          setColumns((prev) =>
            prev.map((col) => {
              if (col.id === newTask.columnId) {
                return { ...col, tasks: [...col.tasks, newTask] };
              }
              return col;
            })
          );
        }}
      />

      {/* Create Column Modal */}
      <CreateColumnModal
        projectId={projectId}
        isOpen={isCreateColumnOpen}
        onClose={() => setIsCreateColumnOpen(false)}
        onColumnCreated={(newCol) => {
          setColumns((prev) => [...prev, { ...newCol, tasks: [] }]);
        }}
      />
    </div>
  );
};
