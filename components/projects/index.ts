// Project Management Components
export { default as ProjectDashboard } from './ProjectDashboard'
export { default as ProjectDetailView } from './ProjectDetailView'
export { default as TaskManagement } from './TaskManagement'
export { default as ClientPortal } from './ClientPortal'
export { default as TimeTracking } from './TimeTracking'
export { default as FileManagement } from './FileManagement'
export { default as CommentsSystem } from './CommentsSystem'
export { default as MilestoneTracker } from './MilestoneTracker'

// Re-export types for convenience
export type {
  Project,
  Task,
  Milestone,
  Deliverable,
  TimeEntry,
  ProjectComment,
  ProjectFile,
  ProjectActivity,
  ProjectStats,
  TaskCounts,
  ProjectFilters,
  TaskFilters,
  ProjectViewState,
  TaskViewState,
  ProjectPermissions,
  CreateProjectData,
  CreateTaskData,
  CreateMilestoneData,
  CreateCommentData,
  CreateTimeEntryData
} from '@/lib/types/projects'