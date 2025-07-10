// Project Management Types
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type DeliverableStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'revision-needed';
export type CommentType = 'general' | 'approval' | 'feedback' | 'internal';
export type CommentVisibility = 'project' | 'client' | 'internal';
export type FileVisibility = 'project' | 'client' | 'internal';
export type MemberRole = 'project-manager' | 'developer' | 'designer' | 'qa' | 'client-contact';

// Base interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimated_duration_days?: number;
  template_data?: any;
  agency_account_id?: string;
  is_public: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  budget?: number;
  currency?: string;
  start_date?: Date;
  due_date?: Date;
  completed_at?: Date;
  agency_account_id: string;
  client_account_id?: string;
  client_user_id?: string;
  project_manager_id: string;
  template_id?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
  
  // Joined fields
  project_manager_name?: string;
  project_manager_email?: string;
  client_name?: string;
  agency_name?: string;
  
  // Computed fields
  task_counts?: TaskCounts;
  progress_percentage?: number;
  overdue_tasks?: number;
  team_members?: ProjectMember[];
  recent_activity?: ProjectActivity[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: MemberRole;
  permissions?: any;
  hourly_rate?: number;
  added_at: Date;
  removed_at?: Date;
  
  // Joined fields
  user_name: string;
  user_email: string;
  user_image?: string;
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigned_to?: string;
  estimated_hours?: number;
  actual_hours?: number;
  start_date?: Date;
  due_date?: Date;
  completed_at?: Date;
  tags?: string[];
  order_index: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  
  // Joined fields
  assigned_user_name?: string;
  assigned_user_image?: string;
  milestone_name?: string;
  
  // Computed fields
  subtasks?: Task[];
  comments_count?: number;
  files_count?: number;
  is_overdue?: boolean;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  due_date?: Date;
  status: MilestoneStatus;
  order_index: number;
  completion_percentage: number;
  requires_client_approval: boolean;
  client_approved_at?: Date;
  client_approved_by?: string;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Computed fields
  tasks?: Task[];
  task_counts?: TaskCounts;
  is_overdue?: boolean;
}

export interface Deliverable {
  id: string;
  project_id: string;
  milestone_id?: string;
  task_id?: string;
  name: string;
  description?: string;
  type: string;
  status: DeliverableStatus;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  requires_client_approval: boolean;
  submitted_at?: Date;
  submitted_by?: string;
  reviewed_at?: Date;
  reviewed_by?: string;
  approval_notes?: string;
  due_date?: Date;
  version: number;
  created_at: Date;
  updated_at: Date;
  
  // Joined fields
  submitted_by_name?: string;
  reviewed_by_name?: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  task_id?: string;
  deliverable_id?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  visibility: FileVisibility;
  uploaded_by: string;
  created_at: Date;
  
  // Joined fields
  uploaded_by_name: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  task_id?: string;
  user_id: string;
  description?: string;
  hours: number; // in minutes
  billable: boolean;
  hourly_rate?: number;
  started_at: Date;
  ended_at?: Date;
  invoiced: boolean;
  invoice_id?: string;
  created_at: Date;
  updated_at: Date;
  
  // Joined fields
  user_name: string;
  task_title?: string;
}

export interface ProjectComment {
  id: string;
  project_id?: string;
  task_id?: string;
  deliverable_id?: string;
  parent_comment_id?: string;
  content: string;
  comment_type: CommentType;
  visibility: CommentVisibility;
  mentions?: string[];
  author_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  
  // Joined fields
  author_name: string;
  author_image?: string;
  
  // Computed fields
  replies?: ProjectComment[];
  can_edit?: boolean;
  can_delete?: boolean;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  old_values?: any;
  new_values?: any;
  created_at: Date;
  
  // Joined fields
  user_name?: string;
  user_image?: string;
}

// Utility types
export interface TaskCounts {
  todo: number;
  in_progress: number;
  review: number;
  completed: number;
  blocked: number;
  total: number;
}

export interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  overdue_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_hours: number;
  billable_hours: number;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: Priority[];
  project_manager_id?: string;
  client_id?: string;
  search?: string;
  date_range?: {
    start: Date;
    end: Date;
  };
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  assigned_to?: string;
  milestone_id?: string;
  search?: string;
  overdue_only?: boolean;
}

// API Response types
export interface ProjectsResponse {
  projects: Project[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TasksResponse {
  tasks: Task[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface CreateProjectData {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  budget?: number;
  currency?: string;
  start_date?: Date;
  due_date?: Date;
  agency_account_id: string;
  client_account_id?: string;
  client_user_id?: string;
  project_manager_id: string;
  template_id?: string;
  metadata?: any;
}

export interface CreateTaskData {
  project_id: string;
  milestone_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigned_to?: string;
  estimated_hours?: number;
  start_date?: Date;
  due_date?: Date;
  tags?: string[];
}

export interface CreateMilestoneData {
  project_id: string;
  name: string;
  description?: string;
  due_date?: Date;
  order_index?: number;
  requires_client_approval?: boolean;
}

export interface CreateCommentData {
  project_id?: string;
  task_id?: string;
  deliverable_id?: string;
  parent_comment_id?: string;
  content: string;
  comment_type?: CommentType;
  visibility?: CommentVisibility;
  mentions?: string[];
}

export interface CreateTimeEntryData {
  project_id: string;
  task_id?: string;
  description?: string;
  hours: number;
  billable?: boolean;
  started_at: Date;
  ended_at?: Date;
}

// UI State types
export interface ProjectViewState {
  view: 'list' | 'grid' | 'kanban';
  filters: ProjectFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface TaskViewState {
  view: 'list' | 'kanban';
  filters: TaskFilters;
  groupBy: 'status' | 'assignee' | 'milestone' | 'priority';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Permission types
export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageTasks: boolean;
  canManageFiles: boolean;
  canViewFinancials: boolean;
  canApprove: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}