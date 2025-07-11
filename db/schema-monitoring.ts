import { pgTable, text, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './schema'

// Security events table for logging security-related activities
export const security_events = pgTable('security_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: text('event_type').notNull(),
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  details: jsonb('details'), // JSON object with event-specific details
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventTypeIdx: index('security_events_event_type_idx').on(table.eventType),
  severityIdx: index('security_events_severity_idx').on(table.severity),
  userIdIdx: index('security_events_user_id_idx').on(table.userId),
  createdAtIdx: index('security_events_created_at_idx').on(table.createdAt),
}))

// Chat sessions table for analytics (if not already exists)
export const chat_sessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  agentId: uuid('agent_id'), // Reference to agents table
  state: jsonb('state'), // JSON state of the chat session
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('chat_sessions_user_id_idx').on(table.userId),
  agentIdIdx: index('chat_sessions_agent_id_idx').on(table.agentId),
  createdAtIdx: index('chat_sessions_created_at_idx').on(table.createdAt),
}))

// Usage metrics table for tracking API usage and billing
export const usage_metrics = pgTable('usage_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  metricType: text('metric_type').notNull(), // 'api_call', 'agent_download', 'agent_share', etc.
  value: text('value').notNull(), // The metric value (could be count, duration, etc.)
  metadata: jsonb('metadata'), // Additional metadata about the metric
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('usage_metrics_user_id_idx').on(table.userId),
  metricTypeIdx: index('usage_metrics_metric_type_idx').on(table.metricType),
  createdAtIdx: index('usage_metrics_created_at_idx').on(table.createdAt),
}))

// Performance metrics table for system monitoring
export const performance_metrics = pgTable('performance_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  endpoint: text('endpoint').notNull(), // API endpoint or page
  method: text('method'), // HTTP method for API endpoints
  duration: text('duration').notNull(), // Response time in milliseconds
  status: text('status'), // HTTP status code or success/failure
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'), // Additional performance data
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  endpointIdx: index('performance_metrics_endpoint_idx').on(table.endpoint),
  createdAtIdx: index('performance_metrics_created_at_idx').on(table.createdAt),
  userIdIdx: index('performance_metrics_user_id_idx').on(table.userId),
}))

// Error logs table for application errors
export const error_logs = pgTable('error_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  errorType: text('error_type').notNull(), // Type of error (e.g., 'api_error', 'validation_error')
  message: text('message').notNull(), // Error message
  stack: text('stack'), // Stack trace (if available)
  context: jsonb('context'), // Additional context about the error
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  resolved: timestamp('resolved'), // When the error was resolved (if applicable)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  errorTypeIdx: index('error_logs_error_type_idx').on(table.errorType),
  createdAtIdx: index('error_logs_created_at_idx').on(table.createdAt),
  userIdIdx: index('error_logs_user_id_idx').on(table.userId),
  resolvedIdx: index('error_logs_resolved_idx').on(table.resolved),
}))

// Export all monitoring-related tables
export {
  security_events,
  chat_sessions,
  usage_metrics,
  performance_metrics,
  error_logs
}
