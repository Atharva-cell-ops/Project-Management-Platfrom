import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Settings, ArrowLeft } from 'lucide-react';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { KanbanBoardSkeleton } from '../components/ui/Skeleton';
import { AvatarGroup } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import apiClient from '../api/client';
import { Project, ApiResponse } from '../types';

export const BoardViewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get<ApiResponse<Project>>(`/projects/${projectId}`);
      if (res.data.success && res.data.data) {
        setProject(res.data.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load project board.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        <KanbanBoardSkeleton />
      </div>
    );
  }

  if (errorMessage || !project) {
    return (
      <EmptyState
        title="Project Not Accessible"
        description={errorMessage || 'Project could not be found or you do not have permission to view it.'}
        actionText="Back to Projects"
        onAction={() => window.location.assign('/projects')}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Board Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to all projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {project.key}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {project.name}
              </h2>
            </div>
            {project.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Header Right Actions: Members & Settings */}
        <div className="flex items-center gap-3">
          {project.members && project.members.length > 0 && (
            <AvatarGroup
              users={project.members.map((m) => m.user)}
              max={5}
              size="sm"
            />
          )}

          <Link
            to={`/projects/${project.id}/settings`}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            title="Project Settings & Members"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Interactive Kanban Board */}
      <KanbanBoard
        projectId={project.id}
        initialColumns={project.columns || []}
        members={project.members || []}
        labels={project.labels || []}
      />
    </div>
  );
};
