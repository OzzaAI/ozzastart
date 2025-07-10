import { relations } from "drizzle-orm/relations";
import { 
  user, 
  ozza_accounts, 
  project_templates,
  projects,
  project_members,
  milestones,
  tasks,
  deliverables,
  project_files,
  time_entries,
  project_comments,
  project_activity_log,
  recurring_workflows
} from "./schema";

// Project Management Relations

export const projectTemplatesRelations = relations(project_templates, ({ one, many }) => ({
  // A template belongs to an agency (optional - null for global templates)
  agency: one(ozza_accounts, {
    fields: [project_templates.agency_account_id],
    references: [ozza_accounts.id],
  }),
  // A template is created by a user
  creator: one(user, {
    fields: [project_templates.created_by],
    references: [user.id],
  }),
  // A template can be used by many projects
  projects: many(projects),
  // A template can have recurring workflows
  recurringWorkflows: many(recurring_workflows),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  // A project belongs to an agency
  agency: one(ozza_accounts, {
    fields: [projects.agency_account_id],
    references: [ozza_accounts.id],
  }),
  // A project may have a client account
  clientAccount: one(ozza_accounts, {
    fields: [projects.client_account_id],
    references: [ozza_accounts.id],
  }),
  // A project may have a direct client user
  clientUser: one(user, {
    fields: [projects.client_user_id],
    references: [user.id],
  }),
  // A project has a project manager
  projectManager: one(user, {
    fields: [projects.project_manager_id],
    references: [user.id],
  }),
  // A project may be based on a template
  template: one(project_templates, {
    fields: [projects.template_id],
    references: [project_templates.id],
  }),
  // A project has many members
  members: many(project_members),
  // A project has many milestones
  milestones: many(milestones),
  // A project has many tasks
  tasks: many(tasks),
  // A project has many deliverables
  deliverables: many(deliverables),
  // A project has many files
  files: many(project_files),
  // A project has many time entries
  timeEntries: many(time_entries),
  // A project has many comments
  comments: many(project_comments),
  // A project has many activity logs
  activityLogs: many(project_activity_log),
}));

export const projectMembersRelations = relations(project_members, ({ one }) => ({
  // A project member belongs to a project
  project: one(projects, {
    fields: [project_members.project_id],
    references: [projects.id],
  }),
  // A project member is a user
  user: one(user, {
    fields: [project_members.user_id],
    references: [user.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  // A milestone belongs to a project
  project: one(projects, {
    fields: [milestones.project_id],
    references: [projects.id],
  }),
  // A milestone may be approved by a client
  clientApprover: one(user, {
    fields: [milestones.client_approved_by],
    references: [user.id],
  }),
  // A milestone has many tasks
  tasks: many(tasks),
  // A milestone has many deliverables
  deliverables: many(deliverables),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  // A task belongs to a project
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id],
  }),
  // A task may belong to a milestone
  milestone: one(milestones, {
    fields: [tasks.milestone_id],
    references: [milestones.id],
  }),
  // A task may have a parent task (for subtasks)
  parentTask: one(tasks, {
    fields: [tasks.parent_task_id],
    references: [tasks.id],
  }),
  // A task may be assigned to a user
  assignee: one(user, {
    fields: [tasks.assigned_to],
    references: [user.id],
  }),
  // A task is created by a user
  creator: one(user, {
    fields: [tasks.created_by],
    references: [user.id],
  }),
  // A task can have subtasks
  subtasks: many(tasks),
  // A task has many deliverables
  deliverables: many(deliverables),
  // A task has many files
  files: many(project_files),
  // A task has many time entries
  timeEntries: many(time_entries),
  // A task has many comments
  comments: many(project_comments),
}));

export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  // A deliverable belongs to a project
  project: one(projects, {
    fields: [deliverables.project_id],
    references: [projects.id],
  }),
  // A deliverable may belong to a milestone
  milestone: one(milestones, {
    fields: [deliverables.milestone_id],
    references: [milestones.id],
  }),
  // A deliverable may belong to a task
  task: one(tasks, {
    fields: [deliverables.task_id],
    references: [tasks.id],
  }),
  // A deliverable may be submitted by a user
  submitter: one(user, {
    fields: [deliverables.submitted_by],
    references: [user.id],
  }),
  // A deliverable may be reviewed by a user
  reviewer: one(user, {
    fields: [deliverables.reviewed_by],
    references: [user.id],
  }),
  // A deliverable has many files
  files: many(project_files),
  // A deliverable has many comments
  comments: many(project_comments),
}));

export const projectFilesRelations = relations(project_files, ({ one }) => ({
  // A file belongs to a project
  project: one(projects, {
    fields: [project_files.project_id],
    references: [projects.id],
  }),
  // A file may belong to a task
  task: one(tasks, {
    fields: [project_files.task_id],
    references: [tasks.id],
  }),
  // A file may belong to a deliverable
  deliverable: one(deliverables, {
    fields: [project_files.deliverable_id],
    references: [deliverables.id],
  }),
  // A file is uploaded by a user
  uploader: one(user, {
    fields: [project_files.uploaded_by],
    references: [user.id],
  }),
}));

export const timeEntriesRelations = relations(time_entries, ({ one }) => ({
  // A time entry belongs to a project
  project: one(projects, {
    fields: [time_entries.project_id],
    references: [projects.id],
  }),
  // A time entry may belong to a task
  task: one(tasks, {
    fields: [time_entries.task_id],
    references: [tasks.id],
  }),
  // A time entry belongs to a user
  user: one(user, {
    fields: [time_entries.user_id],
    references: [user.id],
  }),
}));

export const projectCommentsRelations = relations(project_comments, ({ one, many }) => ({
  // A comment may belong to a project
  project: one(projects, {
    fields: [project_comments.project_id],
    references: [projects.id],
  }),
  // A comment may belong to a task
  task: one(tasks, {
    fields: [project_comments.task_id],
    references: [tasks.id],
  }),
  // A comment may belong to a deliverable
  deliverable: one(deliverables, {
    fields: [project_comments.deliverable_id],
    references: [deliverables.id],
  }),
  // A comment may have a parent comment (for replies)
  parentComment: one(project_comments, {
    fields: [project_comments.parent_comment_id],
    references: [project_comments.id],
  }),
  // A comment is authored by a user
  author: one(user, {
    fields: [project_comments.author_id],
    references: [user.id],
  }),
  // A comment can have replies
  replies: many(project_comments),
}));

export const projectActivityLogRelations = relations(project_activity_log, ({ one }) => ({
  // An activity log entry belongs to a project
  project: one(projects, {
    fields: [project_activity_log.project_id],
    references: [projects.id],
  }),
  // An activity log entry may be associated with a user
  user: one(user, {
    fields: [project_activity_log.user_id],
    references: [user.id],
  }),
}));

export const recurringWorkflowsRelations = relations(recurring_workflows, ({ one }) => ({
  // A recurring workflow belongs to an agency
  agency: one(ozza_accounts, {
    fields: [recurring_workflows.agency_account_id],
    references: [ozza_accounts.id],
  }),
  // A recurring workflow may be based on a template
  template: one(project_templates, {
    fields: [recurring_workflows.template_id],
    references: [project_templates.id],
  }),
  // A recurring workflow may have a default client account
  defaultClientAccount: one(ozza_accounts, {
    fields: [recurring_workflows.default_client_account_id],
    references: [ozza_accounts.id],
  }),
  // A recurring workflow may have a default project manager
  defaultProjectManager: one(user, {
    fields: [recurring_workflows.default_project_manager_id],
    references: [user.id],
  }),
  // A recurring workflow is created by a user
  creator: one(user, {
    fields: [recurring_workflows.created_by],
    references: [user.id],
  }),
}));

// Extended relations for existing tables to include project management

export const userProjectRelations = relations(user, ({ many }) => ({
  // A user can create project templates
  createdProjectTemplates: many(project_templates),
  // A user can manage projects
  managedProjects: many(projects),
  // A user can be a client for projects
  clientProjects: many(projects),
  // A user can be a member of projects
  projectMemberships: many(project_members),
  // A user can approve milestones
  approvedMilestones: many(milestones),
  // A user can be assigned tasks
  assignedTasks: many(tasks),
  // A user can create tasks
  createdTasks: many(tasks),
  // A user can submit deliverables
  submittedDeliverables: many(deliverables),
  // A user can review deliverables
  reviewedDeliverables: many(deliverables),
  // A user can upload files
  uploadedFiles: many(project_files),
  // A user can log time
  timeEntries: many(time_entries),
  // A user can comment
  comments: many(project_comments),
  // A user can have activity logs
  activityLogs: many(project_activity_log),
  // A user can create recurring workflows
  createdRecurringWorkflows: many(recurring_workflows),
  // A user can be default project manager for workflows
  defaultManagedWorkflows: many(recurring_workflows),
}));

export const ozzaAccountsProjectRelations = relations(ozza_accounts, ({ many }) => ({
  // An account can have project templates
  projectTemplates: many(project_templates),
  // An account can have projects as agency
  agencyProjects: many(projects),
  // An account can have projects as client
  clientProjects: many(projects),
  // An account can have recurring workflows
  recurringWorkflows: many(recurring_workflows),
  // An account can be default client for workflows
  defaultClientWorkflows: many(recurring_workflows),
}));