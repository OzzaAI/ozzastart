import { pgTable, text, timestamp, integer, uuid, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Better Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  role: text("role").notNull().default('client'),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  createdAt: timestamp("createdAt").notNull(),
  modifiedAt: timestamp("modifiedAt"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  recurringInterval: text("recurringInterval").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  canceledAt: timestamp("canceledAt"),
  startedAt: timestamp("startedAt").notNull(),
  endsAt: timestamp("endsAt"),
  endedAt: timestamp("endedAt"),
  customerId: text("customerId").notNull(),
  productId: text("productId").notNull(),
  discountId: text("discountId"),
  checkoutId: text("checkoutId").notNull(),
  customerCancellationReason: text("customerCancellationReason"),
  customerCancellationComment: text("customerCancellationComment"),
  metadata: text("metadata"),
  customFieldData: text("customFieldData"),
  userId: text("userId").references(() => user.id),
});

// Ozza Custom Tables
export const ozza_accounts = pgTable("ozza_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logo_url: text("logo_url"),
  primary_color: text("primary_color"),
  secondary_color: text("secondary_color"),
  owner_id: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const ozza_account_members = pgTable("ozza_account_members", {
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  account_id: text("account_id").notNull().references(() => ozza_accounts.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const user_profiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  phone_number: text("phone_number"),
  address: text("address"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const client_invitations = pgTable("client_invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  client_name: text("client_name").notNull(),
  client_email: text("client_email").notNull(),
  account_id: text("account_id").notNull().references(() => ozza_accounts.id, { onDelete: "cascade" }),
  expires_at: timestamp("expires_at").notNull(),
  status: text("status").notNull().default('pending'),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const plans = pgTable("plans", {
  plan_id: text("plan_id").primaryKey(),
  name: text("name").notNull(),
  monthly_price: integer("monthly_price"),
  annual_price: integer("annual_price"),
  stripe_price_id: text("stripe_price_id"),
  stripe_product_id: text("stripe_product_id"),
  max_sites: integer("max_sites"),
  max_users: integer("max_users"),
});

export const features = pgTable("features", {
  feature_key: text("feature_key").primaryKey(),
  description: text("description").notNull(),
});

export const account_features = pgTable("account_features", {
  account_id: text("account_id").notNull().references(() => ozza_accounts.id, { onDelete: "cascade" }),
  feature_key: text("feature_key").notNull().references(() => features.feature_key, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const domains = pgTable("domains", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  account_id: text("account_id").notNull().references(() => ozza_accounts.id, { onDelete: "cascade" }),
  host: text("host").notNull().unique(),
  site_id: uuid("site_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const billing_events = pgTable("billing_events", {
  id: text("id").primaryKey(),
  event_type: text("event_type").notNull(),
  account_id: text("account_id").references(() => ozza_accounts.id, { onDelete: "cascade" }),
  raw: jsonb("raw").notNull(),
  processed_at: timestamp("processed_at").notNull().defaultNow(),
});

export const community_links = pgTable("community_links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  link_code: text("link_code").notNull().unique(),
  max_uses: integer("max_uses").notNull().default(100),
  usage_count: integer("usage_count").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const agency_invitations = pgTable("agency_invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  agency_name: text("agency_name").notNull(),
  agency_email: text("agency_email").notNull(),
  coach_account_id: text("coach_account_id").notNull().references(() => ozza_accounts.id, { onDelete: "cascade" }),
  expires_at: timestamp("expires_at").notNull(),
  status: text("status").notNull().default('pending'),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Project Management Tables

export const project_templates = pgTable("project_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // e.g., 'web-development', 'ai-integration', 'marketing-automation'
  estimated_duration_days: integer("estimated_duration_days"),
  template_data: jsonb("template_data"), // Stores template structure for tasks/milestones
  agency_account_id: text("agency_account_id").references(() => ozza_accounts.id, { onDelete: "cascade" }), // null for global templates
  is_public: boolean("is_public").notNull().default(false),
  created_by: text("created_by").notNull().references(() => user.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default('planning'), // planning, active, on-hold, completed, cancelled
  priority: text("priority").notNull().default('medium'), // low, medium, high, urgent
  budget: integer("budget"), // in cents
  currency: text("currency").default('USD'),
  start_date: timestamp("start_date"),
  due_date: timestamp("due_date"),
  completed_at: timestamp("completed_at"),
  
  // Relationships
  agency_account_id: text("agency_account_id").notNull().references(() => ozza_accounts.id, { onDelete: "cascade" }),
  client_account_id: text("client_account_id").references(() => ozza_accounts.id, { onDelete: "cascade" }), // Client's account if they have one
  client_user_id: text("client_user_id").references(() => user.id, { onDelete: "set null" }), // Direct client user reference
  project_manager_id: text("project_manager_id").notNull().references(() => user.id),
  template_id: uuid("template_id").references(() => project_templates.id, { onDelete: "set null" }),
  
  // Metadata
  metadata: jsonb("metadata"), // Custom fields, integrations, etc.
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  agencyIdx: index("projects_agency_idx").on(table.agency_account_id),
  clientIdx: index("projects_client_idx").on(table.client_account_id),
  statusIdx: index("projects_status_idx").on(table.status),
  priorityIdx: index("projects_priority_idx").on(table.priority),
  managerIdx: index("projects_manager_idx").on(table.project_manager_id),
}));

export const project_members = pgTable("project_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // project-manager, developer, designer, qa, client-contact
  permissions: jsonb("permissions"), // Custom permissions object
  hourly_rate: integer("hourly_rate"), // in cents per hour
  added_at: timestamp("added_at").notNull().defaultNow(),
  removed_at: timestamp("removed_at"),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  due_date: timestamp("due_date"),
  status: text("status").notNull().default('pending'), // pending, in-progress, completed, overdue
  order_index: integer("order_index").notNull().default(0),
  completion_percentage: integer("completion_percentage").notNull().default(0), // 0-100
  requires_client_approval: boolean("requires_client_approval").notNull().default(false),
  client_approved_at: timestamp("client_approved_at"),
  client_approved_by: text("client_approved_by").references(() => user.id),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  milestone_id: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  parent_task_id: uuid("parent_task_id").references(() => tasks.id, { onDelete: "cascade" }), // For subtasks
  
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default('todo'), // todo, in-progress, review, completed, blocked
  priority: text("priority").notNull().default('medium'), // low, medium, high, urgent
  
  // Assignment and time tracking
  assigned_to: text("assigned_to").references(() => user.id),
  estimated_hours: integer("estimated_hours"),
  actual_hours: integer("actual_hours").default(0),
  
  // Dates
  start_date: timestamp("start_date"),
  due_date: timestamp("due_date"),
  completed_at: timestamp("completed_at"),
  
  // Task metadata
  tags: jsonb("tags"), // Array of tags
  order_index: integer("order_index").notNull().default(0),
  
  created_by: text("created_by").notNull().references(() => user.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  projectIdx: index("tasks_project_idx").on(table.project_id),
  assignedIdx: index("tasks_assigned_idx").on(table.assigned_to),
  statusIdx: index("tasks_status_idx").on(table.status),
  milestoneIdx: index("tasks_milestone_idx").on(table.milestone_id),
}));

export const deliverables = pgTable("deliverables", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  milestone_id: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  task_id: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // document, design, code, report, etc.
  status: text("status").notNull().default('pending'), // pending, submitted, approved, rejected, revision-needed
  
  // File information
  file_url: text("file_url"),
  file_name: text("file_name"),
  file_size: integer("file_size"), // in bytes
  file_type: text("file_type"), // MIME type
  
  // Approval workflow
  requires_client_approval: boolean("requires_client_approval").notNull().default(true),
  submitted_at: timestamp("submitted_at"),
  submitted_by: text("submitted_by").references(() => user.id),
  reviewed_at: timestamp("reviewed_at"),
  reviewed_by: text("reviewed_by").references(() => user.id),
  approval_notes: text("approval_notes"),
  
  due_date: timestamp("due_date"),
  version: integer("version").notNull().default(1),
  
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const project_files = pgTable("project_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  task_id: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  deliverable_id: uuid("deliverable_id").references(() => deliverables.id, { onDelete: "cascade" }),
  
  file_name: text("file_name").notNull(),
  file_url: text("file_url").notNull(),
  file_size: integer("file_size"), // in bytes
  file_type: text("file_type"), // MIME type
  description: text("description"),
  
  // Access control
  visibility: text("visibility").notNull().default('project'), // project, client, internal
  
  uploaded_by: text("uploaded_by").notNull().references(() => user.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const time_entries = pgTable("time_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  task_id: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  description: text("description"),
  hours: integer("hours").notNull(), // in minutes for precision
  billable: boolean("billable").notNull().default(true),
  hourly_rate: integer("hourly_rate"), // in cents per hour, captured at time of entry
  
  // Time tracking
  started_at: timestamp("started_at").notNull(),
  ended_at: timestamp("ended_at"),
  
  // Billing
  invoiced: boolean("invoiced").notNull().default(false),
  invoice_id: text("invoice_id"), // Reference to external invoicing system
  
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  projectIdx: index("time_entries_project_idx").on(table.project_id),
  userIdx: index("time_entries_user_idx").on(table.user_id),
  dateIdx: index("time_entries_date_idx").on(table.started_at),
}));

export const project_comments = pgTable("project_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  task_id: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  deliverable_id: uuid("deliverable_id").references(() => deliverables.id, { onDelete: "cascade" }),
  parent_comment_id: uuid("parent_comment_id").references(() => project_comments.id, { onDelete: "cascade" }),
  
  content: text("content").notNull(),
  comment_type: text("comment_type").notNull().default('general'), // general, approval, feedback, internal
  
  // Visibility and notifications
  visibility: text("visibility").notNull().default('project'), // project, client, internal
  mentions: jsonb("mentions"), // Array of user IDs mentioned in comment
  
  author_id: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  deleted_at: timestamp("deleted_at"),
});

export const project_activity_log = pgTable("project_activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  user_id: text("user_id").references(() => user.id, { onDelete: "set null" }),
  
  action: text("action").notNull(), // created, updated, deleted, status_changed, assigned, etc.
  entity_type: text("entity_type").notNull(), // project, task, milestone, deliverable, comment
  entity_id: uuid("entity_id"), // ID of the affected entity
  
  details: jsonb("details"), // Additional context about the action
  old_values: jsonb("old_values"), // Previous values for updates
  new_values: jsonb("new_values"), // New values for updates
  
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const recurring_workflows = pgTable("recurring_workflows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  agency_account_id: text("agency_account_id").notNull().references(() => ozza_accounts.id, { onDelete: "cascade" }),
  template_id: uuid("template_id").references(() => project_templates.id, { onDelete: "cascade" }),
  
  // Recurrence settings
  frequency: text("frequency").notNull(), // daily, weekly, monthly, quarterly, yearly
  interval_value: integer("interval_value").notNull().default(1), // every X frequency units
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date"),
  
  // Auto-creation settings
  auto_create: boolean("auto_create").notNull().default(false),
  create_days_before: integer("create_days_before").default(0), // create project X days before due
  
  // Default project settings
  default_client_account_id: text("default_client_account_id").references(() => ozza_accounts.id),
  default_project_manager_id: text("default_project_manager_id").references(() => user.id),
  
  is_active: boolean("is_active").notNull().default(true),
  created_by: text("created_by").notNull().references(() => user.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

