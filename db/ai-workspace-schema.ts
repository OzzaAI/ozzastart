import { pgTable, text, timestamp, integer, uuid, boolean, jsonb, index, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user, ozza_accounts } from "./schema";

// ============================================================================
// AI WORKSPACE CORE TABLES
// ============================================================================

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // for workspace URLs
  description: text("description"),
  
  // Ownership & Management
  owner_id: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  agency_account_id: text("agency_account_id").references(() => ozza_accounts.id), // if created by agency
  
  // Configuration
  business_context: jsonb("business_context"), // Company info, industry, goals
  ai_configuration: jsonb("ai_configuration"), // LLM settings, context preferences
  branding: jsonb("branding"), // Colors, logo, white-labeling
  
  // Subscription & Billing
  subscription_tier: text("subscription_tier").notNull().default('starter'), // starter, professional, enterprise
  token_limit: integer("token_limit").notNull().default(100000),
  tokens_used_current_period: integer("tokens_used_current_period").notNull().default(0),
  billing_period_start: timestamp("billing_period_start").notNull().defaultNow(),
  billing_period_end: timestamp("billing_period_end").notNull(),
  
  // Status
  status: text("status").notNull().default('active'), // active, suspended, cancelled
  setup_completed: boolean("setup_completed").notNull().default(false),
  
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  ownerIdx: index("workspace_owner_idx").on(table.owner_id),
  agencyIdx: index("workspace_agency_idx").on(table.agency_account_id),
  slugIdx: index("workspace_slug_idx").on(table.slug),
}));

export const workspace_members = pgTable("workspace_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  role: text("role").notNull().default('user'), // owner, admin, user, viewer
  permissions: jsonb("permissions"), // Custom permissions per user
  
  // Access Control
  allowed_integrations: jsonb("allowed_integrations"), // Which MCPs/APIs they can use
  token_limit: integer("token_limit"), // Individual token limits
  
  invited_by: text("invited_by").references(() => user.id),
  joined_at: timestamp("joined_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  workspaceUserIdx: index("workspace_member_idx").on(table.workspace_id, table.user_id),
}));

// ============================================================================
// MCP INTEGRATION SYSTEM
// ============================================================================

export const mcp_integrations = pgTable("mcp_integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  
  // Developer Info
  developer_id: text("developer_id").notNull().references(() => user.id),
  developer_account_id: text("developer_account_id").references(() => ozza_accounts.id),
  
  // MCP Configuration
  mcp_config: jsonb("mcp_config").notNull(), // MCP protocol configuration
  webhook_endpoints: jsonb("webhook_endpoints"), // For n8n integration
  api_requirements: jsonb("api_requirements"), // Required API keys/OAuth
  
  // Categorization
  category: text("category").notNull(), // sales, marketing, finance, operations
  tags: jsonb("tags"), // Array of tags for discovery
  
  // Review & Deployment
  review_status: text("review_status").notNull().default('pending'), // pending, approved, rejected
  review_tier: text("review_tier").notNull().default('free'), // free, premium, enterprise
  reviewed_by: text("reviewed_by").references(() => user.id),
  reviewed_at: timestamp("reviewed_at"),
  review_notes: text("review_notes"),
  
  // Deployment
  deployed_at: timestamp("deployed_at"),
  version: text("version").notNull().default('1.0.0'),
  
  // Usage & Revenue
  total_installations: integer("total_installations").notNull().default(0),
  monthly_active_users: integer("monthly_active_users").notNull().default(0),
  revenue_share_percentage: decimal("revenue_share_percentage", { precision: 5, scale: 2 }).notNull().default('100.00'),
  
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  developerIdx: index("mcp_developer_idx").on(table.developer_id),
  statusIdx: index("mcp_status_idx").on(table.review_status),
  categoryIdx: index("mcp_category_idx").on(table.category),
}));

export const workspace_integrations = pgTable("workspace_integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  mcp_integration_id: uuid("mcp_integration_id").notNull().references(() => mcp_integrations.id, { onDelete: "cascade" }),
  
  // Configuration
  configuration: jsonb("configuration"), // Workspace-specific MCP config
  api_credentials: jsonb("api_credentials"), // Encrypted API keys/tokens
  
  // Status
  status: text("status").notNull().default('active'), // active, inactive, error
  last_used: timestamp("last_used"),
  usage_count: integer("usage_count").notNull().default(0),
  
  installed_by: text("installed_by").notNull().references(() => user.id),
  installed_at: timestamp("installed_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index("workspace_integration_idx").on(table.workspace_id),
  mcpIdx: index("integration_mcp_idx").on(table.mcp_integration_id),
}));

// ============================================================================
// AUTOMATION & WEBHOOK SYSTEM
// ============================================================================

export const automation_connections = pgTable("automation_connections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  
  // Connection Details
  name: text("name").notNull(),
  platform: text("platform").notNull(), // n8n, zapier, make.com
  webhook_url: text("webhook_url").notNull(),
  webhook_secret: text("webhook_secret"),
  
  // Configuration
  automation_config: jsonb("automation_config"), // Platform-specific config
  trigger_conditions: jsonb("trigger_conditions"), // When to trigger
  
  // Status & Monitoring
  status: text("status").notNull().default('active'),
  last_triggered: timestamp("last_triggered"),
  total_executions: integer("total_executions").notNull().default(0),
  success_rate: decimal("success_rate", { precision: 5, scale: 2 }),
  
  created_by: text("created_by").notNull().references(() => user.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index("automation_workspace_idx").on(table.workspace_id),
}));

export const automation_executions = pgTable("automation_executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  automation_connection_id: uuid("automation_connection_id").notNull().references(() => automation_connections.id, { onDelete: "cascade" }),
  workspace_id: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  
  // Execution Details
  trigger_data: jsonb("trigger_data"), // Data that triggered the automation
  response_data: jsonb("response_data"), // Response from automation platform
  
  // Status
  status: text("status").notNull(), // success, failed, pending
  error_message: text("error_message"),
  execution_time_ms: integer("execution_time_ms"),
  
  executed_at: timestamp("executed_at").notNull().defaultNow(),
}, (table) => ({
  automationIdx: index("execution_automation_idx").on(table.automation_connection_id),
  dateIdx: index("execution_date_idx").on(table.executed_at),
}));

// ============================================================================
// AI CONVERSATION & CONTEXT SYSTEM
// ============================================================================

export const ai_conversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  // Conversation Metadata
  title: text("title"), // Auto-generated or user-set
  session_id: text("session_id"), // For grouping messages
  
  // Context & State
  business_context: jsonb("business_context"), // Relevant business info for this conversation
  active_integrations: jsonb("active_integrations"), // MCPs used in this conversation
  
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  workspaceUserIdx: index("conversation_workspace_user_idx").on(table.workspace_id, table.user_id),
  sessionIdx: index("conversation_session_idx").on(table.session_id),
}));

export const ai_messages = pgTable("ai_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversation_id: uuid("conversation_id").notNull().references(() => ai_conversations.id, { onDelete: "cascade" }),
  
  // Message Content
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Additional message data
  
  // Token Usage
  tokens_used: integer("tokens_used").notNull().default(0),
  cost_cents: integer("cost_cents").notNull().default(0),
  
  // MCP Usage
  mcp_calls: jsonb("mcp_calls"), // Which MCPs were called for this message
  
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  conversationIdx: index("message_conversation_idx").on(table.conversation_id),
  dateIdx: index("message_date_idx").on(table.created_at),
}));

// ============================================================================
// USAGE & BILLING TRACKING
// ============================================================================

export const token_usage = pgTable("token_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  // Usage Details
  tokens_consumed: integer("tokens_consumed").notNull(),
  cost_cents: integer("cost_cents").notNull(),
  usage_type: text("usage_type").notNull(), // chat, mcp_call, automation
  
  // Context
  conversation_id: uuid("conversation_id").references(() => ai_conversations.id),
  mcp_integration_id: uuid("mcp_integration_id").references(() => mcp_integrations.id),
  
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index("usage_workspace_idx").on(table.workspace_id),
  dateIdx: index("usage_date_idx").on(table.created_at),
  userIdx: index("usage_user_idx").on(table.user_id),
}));

export const revenue_sharing = pgTable("revenue_sharing", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Parties
  workspace_id: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  coach_id: text("coach_id").references(() => user.id), // Referring coach
  agency_id: text("agency_id").references(() => user.id), // Managing agency
  developer_id: text("developer_id").references(() => user.id), // MCP developer
  
  // Revenue Details
  total_revenue_cents: integer("total_revenue_cents").notNull(),
  coach_share_cents: integer("coach_share_cents").notNull().default(0),
  agency_share_cents: integer("agency_share_cents").notNull().default(0),
  developer_share_cents: integer("developer_share_cents").notNull().default(0),
  ozza_share_cents: integer("ozza_share_cents").notNull(),
  
  // Period
  billing_period_start: timestamp("billing_period_start").notNull(),
  billing_period_end: timestamp("billing_period_end").notNull(),
  
  // Status
  payout_status: text("payout_status").notNull().default('pending'), // pending, paid, failed
  payout_date: timestamp("payout_date"),
  
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index("revenue_workspace_idx").on(table.workspace_id),
  coachIdx: index("revenue_coach_idx").on(table.coach_id),
  agencyIdx: index("revenue_agency_idx").on(table.agency_id),
  periodIdx: index("revenue_period_idx").on(table.billing_period_start),
}));

// ============================================================================
// COMMUNICATION SYSTEM
// ============================================================================

export const workspace_communications = pgTable("workspace_communications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspace_id: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  
  // Participants
  sender_id: text("sender_id").notNull().references(() => user.id),
  recipient_id: text("recipient_id").references(() => user.id), // null for broadcast
  
  // Message
  subject: text("subject"),
  content: text("content").notNull(),
  message_type: text("message_type").notNull().default('message'), // message, notification, alert
  
  // Status
  read_at: timestamp("read_at"),
  archived_at: timestamp("archived_at"),
  
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index("comm_workspace_idx").on(table.workspace_id),
  recipientIdx: index("comm_recipient_idx").on(table.recipient_id),
}));
