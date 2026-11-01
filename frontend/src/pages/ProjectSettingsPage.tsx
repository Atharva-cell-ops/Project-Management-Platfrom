import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { RoleBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectMember, ProjectRole, ApiResponse } from '../types';

const projectEditSchema = z.object({
  name: z.string().min(2, 'Project name is required').max(60),
  description: z.string().max(500).optional(),
});

type ProjectEditValues = z.infer<typeof projectEditSchema>;

const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

type InviteMemberValues = z.infer<typeof inviteMemberSchema>;

export const ProjectSettingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { isSubmitting: isSavingProject },
  } = useForm<ProjectEditValues>({
    resolver: zodResolver(projectEditSchema),
  });

  const {
    register: registerInvite,
    handleSubmit: handleInviteSubmit,
    reset: resetInvite,
    formState: { errors: inviteErrors, isSubmitting: isInviting },
  } = useForm<InviteMemberValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const fetchProjectAndMembers = async () => {
    if (!projectId) return;
    try {
      const [projRes, membersRes] = await Promise.all([
        apiClient.get<ApiResponse<Project>>(`/projects/${projectId}`),
        apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`),
      ]);

      if (projRes.data.success && projRes.data.data) {
        setProject(projRes.data.data);
        resetEdit({
          name: projRes.data.data.name,
          description: projRes.data.data.description || '',
        });
      }

      if (membersRes.data.success && membersRes.data.data) {
        setMembers(membersRes.data.data);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndMembers();
  }, [projectId]);

  const isOwner = project?.ownerId === user?.id;

  const onUpdateProject = async (values: ProjectEditValues) => {
    if (!projectId) return;
    try {
      const res = await apiClient.patch<ApiResponse<Project>>(
        `/projects/${projectId}`,
        values
      );
      if (res.data.success) {
        success('Project details updated successfully.');
        setProject(res.data.data);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update project.');
    }
  };

  const onInviteMember = async (values: InviteMemberValues) => {
    if (!projectId) return;
    try {
      const res = await apiClient.post<ApiResponse<ProjectMember>>(
        `/projects/${projectId}/members`,
        values
      );
      if (res.data.success) {
        success(`Added ${values.email} to project!`);
        resetInvite();
        setIsInviteModalOpen(false);
        fetchProjectAndMembers();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to add member.');
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: ProjectRole) => {
    if (!projectId) return;
    try {
      const res = await apiClient.patch<ApiResponse<ProjectMember>>(
        `/projects/${projectId}/members/${targetUserId}`,
        { role: newRole }
      );
      if (res.data.success) {
        success('Member role updated.');
        setMembers((prev) =>
          prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m))
        );
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to change role.');
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    if (!projectId || !window.confirm(`Remove ${memberName} from this project?`)) return;
    try {
      const res = await apiClient.delete<ApiResponse<any>>(
        `/projects/${projectId}/members/${targetUserId}`
      );
      if (res.data.success) {
        success('Member removed.');
        setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to remove member.');
    }
  };

  const handleDeleteProject = async () => {
    if (
      !projectId ||
      !window.confirm(
        'Are you sure you want to permanently delete this project and all its tasks?'
      )
    )
      return;

    try {
      const res = await apiClient.delete<ApiResponse<any>>(`/projects/${projectId}`);
      if (res.data.success) {
        success('Project deleted successfully.');
        navigate('/projects');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete project.');
    }
  };

  if (isLoading || !project) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <Link
          to={`/projects/${projectId}/board`}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Project Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage workspace details, member roles, and project lifecycle.
          </p>
        </div>
      </div>

      {/* General Settings Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          General Details
        </h3>
        <form onSubmit={handleEditSubmit(onUpdateProject)} className="space-y-4">
          <Input label="Project Name" {...registerEdit('name')} />
          <Textarea label="Description" rows={3} {...registerEdit('description')} />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSavingProject} size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Team Members Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Team Members ({members.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control member access and project roles.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite Member
          </Button>
        </div>

        {/* Members List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {members.map((m) => (
            <div
              key={m.id}
              className="py-3.5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={m.user.name} src={m.user.avatarUrl} size="md" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {m.user.name} {m.userId === user?.id && '(You)'}
                  </h4>
                  <p className="text-[11px] text-slate-400">{m.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOwner && m.userId !== user?.id ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      handleChangeRole(m.userId, e.target.value as ProjectRole)
                    }
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                ) : (
                  <RoleBadge role={m.role} />
                )}

                {m.userId !== project.ownerId && (
                  <button
                    onClick={() => handleRemoveMember(m.userId, m.user.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-3">
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-xs text-rose-600/90 dark:text-rose-400/80 leading-relaxed">
            Deleting this project will permanently remove all associated Kanban columns, tasks, comments, and activities. This action cannot be undone.
          </p>
          <div className="pt-2">
            <Button variant="danger" size="sm" onClick={handleDeleteProject}>
              Delete Project Workspace
            </Button>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Member to Project"
        description="Add a registered user to this project workspace by their email."
      >
        <form onSubmit={handleInviteSubmit(onInviteMember)} className="space-y-4">
          <Input
            label="User Email Address"
            type="email"
            placeholder="marcus@flowboard.dev"
            leftIcon={<Mail className="w-4 h-4" />}
            error={inviteErrors.email?.message}
            {...registerInvite('email')}
          />

          <Select
            label="Project Role"
            options={[
              { value: 'MEMBER', label: 'Member (Can view, create and update tasks)' },
              { value: 'ADMIN', label: 'Admin (Can manage columns, members and tasks)' },
              { value: 'OWNER', label: 'Owner (Full workspace access)' },
            ]}
            {...registerInvite('role')}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isInviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
