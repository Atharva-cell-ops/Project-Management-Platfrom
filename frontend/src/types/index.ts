export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: User;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: User;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: User;
}

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  label: Label;
}

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  order: number;
  dueDate?: string | null;
  isArchived: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  column?: { id: string; title: string };
  assignees?: TaskAssignee[];
  labels?: TaskLabel[];
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

export interface Column {
  id: string;
  projectId: string;
  title: string;
  order: number;
  tasks: Task[];
}

export interface Activity {
  id: string;
  projectId: string;
  taskId?: string | null;
  userId: string;
  action: string;
  details?: string | null;
  createdAt: string;
  user: User;
  task?: { id: string; title: string } | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  key: string;
  isArchived: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: ProjectMember[];
  columns?: Column[];
  labels?: Label[];
  _count?: {
    tasks: number;
    members: number;
  };
  completedTasksCount?: number;
  activeTasksCount?: number;
}

export interface DashboardMetrics {
  project: {
    id: string;
    name: string;
    description: string | null;
    key: string;
    createdAt: string;
  };
  metrics: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    urgentTasks: number;
    overdueTasks: number;
    membersCount: number;
    completionRate: number;
  };
  columnsBreakdown: {
    id: string;
    title: string;
    taskCount: number;
  }[];
  priorityBreakdown: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  recentActivities: Activity[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  errors?: { field: string; message: string }[];
}
