import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  ArrowUpRight,
  TrendingUp,
  Activity as ActivityIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../components/ui/Avatar';
import { DashboardStatsSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import apiClient from '../api/client';
import { Project, Activity, ApiResponse } from '../types';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const res = await apiClient.get<ApiResponse<Project[]>>('/projects');
        if (res.data.success && res.data.data) {
          const projs = res.data.data;
          setProjects(projs);

          // If there's an active project, load its recent activities
          if (projs.length > 0) {
            const actRes = await apiClient.get<ApiResponse<Activity[]>>(
              `/projects/${projs[0].id}/activities`
            );
            if (actRes.data.success) {
              setActivities(actRes.data.data);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Compute aggregated portfolio metrics across all projects
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + (p._count?.tasks || 0), 0);
  const totalCompletedTasks = projects.reduce((acc, p) => acc + (p.completedTasksCount || 0), 0);
  const totalActiveTasks = totalTasks - totalCompletedTasks;
  const totalMembers = projects.reduce((acc, p) => acc + (p._count?.members || 0), 0);
  const completionRate = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <DashboardStatsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200">
            Portfolio Overview
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Workspace Performance & Insights
          </h2>
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            Track your cross-functional project velocity, active tasks, team distribution, and real-time sprint activities.
          </p>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Projects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Projects
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalProjects}
            </h3>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Active workspaces
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        {/* Active Tasks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Tasks
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalActiveTasks}
            </h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              In progress & review
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Completed Tasks
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalCompletedTasks}
            </h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {completionRate}% rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Team Members */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Team Members
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalMembers}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Across all boards
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Projects List & Real-Time Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Active Projects
            </h3>
            <Link
              to="/projects"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No Projects Yet"
              description="Get started by creating your first project workspace and Kanban board."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => {
                const pTasks = project._count?.tasks || 0;
                const pCompleted = project.completedTasksCount || 0;
                const pRate = pTasks > 0 ? Math.round((pCompleted / pTasks) * 100) : 0;

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}/board`}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {project.key}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {pTasks} tasks
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {project.name}
                      </h4>
                      {project.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-medium">Completion</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {pRate}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pRate}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-time Activity Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-indigo-500" />
            Recent Activity
          </h3>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            {activities.length > 0 ? (
              <div className="space-y-3.5">
                {activities.slice(0, 7).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <Avatar name={act.user.name} src={act.user.avatarUrl} size="xs" />
                    <div className="flex-1">
                      <p className="text-slate-800 dark:text-slate-200 leading-snug">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {act.user.name}
                        </span>{' '}
                        <span className="text-slate-500 lowercase">
                          {act.action.replace('_', ' ')}
                        </span>
                        {act.task && (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                            "{act.task.title}"
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No recent activity recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
