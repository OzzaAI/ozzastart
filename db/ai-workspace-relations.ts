import { relations } from "drizzle-orm/relations";
import { user, ozza_accounts } from "./schema";
import {
  workspaces,
  workspace_members,
  mcp_integrations,
  workspace_integrations,
  automation_connections,
  automation_executions,
  ai_conversations,
  ai_messages,
  token_usage,
  revenue_sharing,
  workspace_communications
} from "./ai-workspace-schema";

// ============================================================================
// WORKSPACE RELATIONS
// ============================================================================

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  // Owner relationship
  owner: one(user, {
    fields: [workspaces.owner_id],
    references: [user.id],
  }),
  
  // Agency relationship (if created by agency)
  agency: one(ozza_accounts, {
    fields: [workspaces.agency_account_id],
    references: [ozza_accounts.id],
  }),
  
  // Members
  members: many(workspace_members),
  
  // Integrations
  integrations: many(workspace_integrations),
  
  // Automations
  automations: many(automation_connections),
  automation_executions: many(automation_executions),
  
  // Conversations
  conversations: many(ai_conversations),
  
  // Usage & Billing
  token_usage: many(token_usage),
  revenue_sharing: many(revenue_sharing),
  
  // Communications
  communications: many(workspace_communications),
}));

export const workspaceMemberRelations = relations(workspace_members, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspace_members.workspace_id],
    references: [workspaces.id],
  }),
  user: one(user, {
    fields: [workspace_members.user_id],
    references: [user.id],
  }),
  invited_by_user: one(user, {
    fields: [workspace_members.invited_by],
    references: [user.id],
  }),
}));

// ============================================================================
// MCP INTEGRATION RELATIONS
// ============================================================================

export const mcpIntegrationRelations = relations(mcp_integrations, ({ one, many }) => ({
  // Developer
  developer: one(user, {
    fields: [mcp_integrations.developer_id],
    references: [user.id],
  }),
  
  developer_account: one(ozza_accounts, {
    fields: [mcp_integrations.developer_account_id],
    references: [ozza_accounts.id],
  }),
  
  // Reviewer
  reviewer: one(user, {
    fields: [mcp_integrations.reviewed_by],
    references: [user.id],
  }),
  
  // Workspace installations
  workspace_installations: many(workspace_integrations),
  
  // Usage tracking
  usage_records: many(token_usage),
}));

export const workspaceIntegrationRelations = relations(workspace_integrations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspace_integrations.workspace_id],
    references: [workspaces.id],
  }),
  
  mcp_integration: one(mcp_integrations, {
    fields: [workspace_integrations.mcp_integration_id],
    references: [mcp_integrations.id],
  }),
  
  installed_by_user: one(user, {
    fields: [workspace_integrations.installed_by],
    references: [user.id],
  }),
}));

// ============================================================================
// AUTOMATION RELATIONS
// ============================================================================

export const automationConnectionRelations = relations(automation_connections, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [automation_connections.workspace_id],
    references: [workspaces.id],
  }),
  
  created_by_user: one(user, {
    fields: [automation_connections.created_by],
    references: [user.id],
  }),
  
  executions: many(automation_executions),
}));

export const automationExecutionRelations = relations(automation_executions, ({ one }) => ({
  automation_connection: one(automation_connections, {
    fields: [automation_executions.automation_connection_id],
    references: [automation_connections.id],
  }),
  
  workspace: one(workspaces, {
    fields: [automation_executions.workspace_id],
    references: [workspaces.id],
  }),
}));

// ============================================================================
// AI CONVERSATION RELATIONS
// ============================================================================

export const aiConversationRelations = relations(ai_conversations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [ai_conversations.workspace_id],
    references: [workspaces.id],
  }),
  
  user: one(user, {
    fields: [ai_conversations.user_id],
    references: [user.id],
  }),
  
  messages: many(ai_messages),
  
  token_usage: many(token_usage),
}));

export const aiMessageRelations = relations(ai_messages, ({ one }) => ({
  conversation: one(ai_conversations, {
    fields: [ai_messages.conversation_id],
    references: [ai_conversations.id],
  }),
}));

// ============================================================================
// USAGE & BILLING RELATIONS
// ============================================================================

export const tokenUsageRelations = relations(token_usage, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [token_usage.workspace_id],
    references: [workspaces.id],
  }),
  
  user: one(user, {
    fields: [token_usage.user_id],
    references: [user.id],
  }),
  
  conversation: one(ai_conversations, {
    fields: [token_usage.conversation_id],
    references: [ai_conversations.id],
  }),
  
  mcp_integration: one(mcp_integrations, {
    fields: [token_usage.mcp_integration_id],
    references: [mcp_integrations.id],
  }),
}));

export const revenueSharingRelations = relations(revenue_sharing, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [revenue_sharing.workspace_id],
    references: [workspaces.id],
  }),
  
  coach: one(user, {
    fields: [revenue_sharing.coach_id],
    references: [user.id],
  }),
  
  agency: one(user, {
    fields: [revenue_sharing.agency_id],
    references: [user.id],
  }),
  
  developer: one(user, {
    fields: [revenue_sharing.developer_id],
    references: [user.id],
  }),
}));

// ============================================================================
// COMMUNICATION RELATIONS
// ============================================================================

export const workspaceCommunicationRelations = relations(workspace_communications, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspace_communications.workspace_id],
    references: [workspaces.id],
  }),
  
  sender: one(user, {
    fields: [workspace_communications.sender_id],
    references: [user.id],
  }),
  
  recipient: one(user, {
    fields: [workspace_communications.recipient_id],
    references: [user.id],
  }),
}));

// ============================================================================
// EXTEND EXISTING USER RELATIONS
// ============================================================================

export const userWorkspaceRelations = relations(user, ({ many }) => ({
  // Owned workspaces
  owned_workspaces: many(workspaces, { relationName: "workspace_owner" }),
  
  // Workspace memberships
  workspace_memberships: many(workspace_members),
  
  // Developed MCPs
  developed_mcps: many(mcp_integrations, { relationName: "mcp_developer" }),
  
  // Reviewed MCPs
  reviewed_mcps: many(mcp_integrations, { relationName: "mcp_reviewer" }),
  
  // Conversations
  ai_conversations: many(ai_conversations),
  
  // Token usage
  token_usage: many(token_usage),
  
  // Revenue sharing (as coach, agency, or developer)
  coach_revenue: many(revenue_sharing, { relationName: "coach_revenue" }),
  agency_revenue: many(revenue_sharing, { relationName: "agency_revenue" }),
  developer_revenue: many(revenue_sharing, { relationName: "developer_revenue" }),
  
  // Communications
  sent_communications: many(workspace_communications, { relationName: "sent_communications" }),
  received_communications: many(workspace_communications, { relationName: "received_communications" }),
}));

export const ozzaAccountWorkspaceRelations = relations(ozza_accounts, ({ many }) => ({
  // Workspaces created by this agency
  created_workspaces: many(workspaces),
  
  // MCPs developed by this account
  developed_mcps: many(mcp_integrations),
}));
