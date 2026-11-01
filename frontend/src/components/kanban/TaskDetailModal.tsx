import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Send,
  CheckCircle2,
  Activity as ActivityIcon,
  MessageSquare,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Task,
  TaskPriority,
  ProjectMember,
  Label,
  Comment,
  Activity,
  ApiResponse,
} from '../../types';

export interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  members: ProjectMember[];
  labels: Label[];
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  members,
  labels,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');

  // Comment input
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchTaskDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
      if (res.data.success && res.data.data) {
        const t = res.data.data;
        setTask(t);
        setTitle(t.title);
        setDescription(t.description || '');
        setPriority(t.priority);
        setDueDate(t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : '');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load task details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTaskDetails(taskId);
    } else {
      setTask(null);
    }
  }, [taskId, isOpen]);

  const handleSaveDetails = async () => {
    if (!taskId || !title.trim()) return;
    try {
      const res = await apiClient.patch<ApiResponse<Task>>(`/tasks/${taskId}`, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });

      if (res.data.success) {
        success('Task updated successfully.');
        setTask(res.data.data);
        if (onTaskUpdated) onTaskUpdated(res.data.data);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update task.');
    }
  };

  const handleToggleAssignee = async (memberUserId: string) => {
    if (!task) return;
    const isAssigned = task.assignees?.some((a) => a.userId === memberUserId);

    try {
      let res;
      if (isAssigned) {
        res = await apiClient.delete<ApiResponse<Task>>(
          `/tasks/${task.id}/assignees/${memberUserId}`
        );
      } else {
        res = await apiClient.post<ApiResponse<Task>>(`/tasks/${task.id}/assignees`, {
          userId: memberUserId,
        });
      }

      if (res.data.success) {
        setTask(res.data.data);
        if (onTaskUpdated) onTaskUpdated(res.data.data);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle assignee.');
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    if (!task) return;
    const isAttached = task.labels?.some((l) => l.labelId === labelId);

    try {
      let res;
      if (isAttached) {
        res = await apiClient.delete<ApiResponse<Task>>(
          `/tasks/${task.id}/labels/${labelId}`
        );
      } else {
        res = await apiClient.post<ApiResponse<Task>>(`/tasks/${task.id}/labels`, {
          labelId,
        });
      }

      if (res.data.success) {
        setTask(res.data.data);
        if (onTaskUpdated) onTaskUpdated(res.data.data);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle label.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await apiClient.post<ApiResponse<Comment>>(
        `/tasks/${taskId}/comments`,
        { content: commentContent }
      );

      if (res.data.success) {
        setCommentContent('');
        // Refresh details to include new comment and updated activity history
        fetchTaskDetails(taskId);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await apiClient.delete<ApiResponse<any>>(
        `/tasks/comments/${commentId}`
      );
      if (res.data.success) {
        setTask((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            comments: prev.comments?.filter((c) => c.id !== commentId),
          };
        });
        success('Comment deleted.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete comment.');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId || !window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await apiClient.delete<ApiResponse<any>>(`/tasks/${taskId}`);
      if (res.data.success) {
        success('Task deleted successfully.');
        onClose();
        if (onTaskDeleted) onTaskDeleted(taskId);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete task.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" showCloseButton={true}>
      {isLoading || !task ? (
        <div className="p-8 text-center text-slate-400">Loading task details...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveDetails}
                className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-slate-100 py-1 transition-colors"
                placeholder="Task Title..."
              />
              <span className="text-xs text-slate-400">
                In column <span className="font-semibold text-slate-600 dark:text-slate-300">{task.column?.title}</span>
              </span>
            </div>

            {/* Description textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveDetails}
                placeholder="Add a detailed description, acceptance criteria, or links..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y"
              />
            </div>

            {/* Comments & Activity Stream Tabs */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-1.5 text-xs font-bold pb-2 -mb-2.5 transition-colors border-b-2 ${
                    activeTab === 'comments'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Comments ({task.comments?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-1.5 text-xs font-bold pb-2 -mb-2.5 transition-colors border-b-2 ${
                    activeTab === 'activity'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ActivityIcon className="w-3.5 h-3.5" />
                  Activity History
                </button>
              </div>

              {activeTab === 'comments' ? (
                <div className="space-y-4">
                  {/* Add comment input form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Write a comment or update..."
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={isSubmittingComment}
                      disabled={!commentContent.trim()}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Post
                    </Button>
                  </form>

                  {/* Comment list */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {task.comments && task.comments.length > 0 ? (
                      task.comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar name={c.user.name} src={c.user.avatarUrl} size="xs" />
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {c.user.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(c.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            {user?.id === c.userId && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 pl-6 leading-relaxed">
                            {c.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        No comments yet. Start the conversation!
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Activity History Stream */
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {(task as any).activities?.map((act: Activity) => (
                    <div key={act.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                      <Avatar name={act.user.name} src={act.user.avatarUrl} size="xs" />
                      <div className="flex-1">
                        <p className="text-slate-800 dark:text-slate-200">
                          <span className="font-semibold">{act.user.name}</span>{' '}
                          <span className="text-slate-500 lowercase">
                            {act.action.replace('_', ' ')}
                          </span>
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Metadata */}
          <div className="space-y-6 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as TaskPriority;
                  setPriority(val);
                  if (taskId) {
                    apiClient.patch(`/tasks/${taskId}`, { priority: val }).then((res) => {
                      if (res.data.success && onTaskUpdated) onTaskUpdated(res.data.data);
                    });
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Priority</option>
              </select>
            </div>

            {/* Due Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDueDate(val);
                    if (taskId) {
                      apiClient
                        .patch(`/tasks/${taskId}`, {
                          dueDate: val ? new Date(val).toISOString() : null,
                        })
                        .then((res) => {
                          if (res.data.success && onTaskUpdated) onTaskUpdated(res.data.data);
                        });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {dueDate && (
                  <button
                    onClick={() => {
                      setDueDate('');
                      if (taskId) {
                        apiClient.patch(`/tasks/${taskId}`, { dueDate: null }).then((res) => {
                          if (res.data.success && onTaskUpdated) onTaskUpdated(res.data.data);
                        });
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                    title="Clear date"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Assignees Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Assignees
              </label>
              <div className="space-y-1.5">
                {members.map((m) => {
                  const isAssigned = task.assignees?.some((a) => a.userId === m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => handleToggleAssignee(m.userId)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all ${
                        isAssigned
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                          : 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={m.user.name} src={m.user.avatarUrl} size="xs" />
                        <span>{m.user.name}</span>
                      </div>
                      {isAssigned && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Labels Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Labels
              </label>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((lbl) => {
                  const isAttached = task.labels?.some((l) => l.labelId === lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => handleToggleLabel(lbl.id)}
                      style={{
                        backgroundColor: isAttached ? `${lbl.color}25` : undefined,
                        borderColor: isAttached ? lbl.color : undefined,
                        color: isAttached ? lbl.color : undefined,
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                        isAttached
                          ? 'ring-1'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {lbl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delete Task Action */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleDeleteTask}
                className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Task Card
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
