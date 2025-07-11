import * as Sentry from '@sentry/nextjs'
import { PostHog } from 'posthog-node'
import posthog from 'posthog-js'
import { db } from '@/db/drizzle'
import { security_events, chat_sessions, agents, users } from '@/db/schema'
import { eq, and, gte, lte, desc, asc, count, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Initialize PostHog server-side client
const posthogServer = process.env.POSTHOG_KEY 
  ? new PostHog(process.env.POSTHOG_KEY, {
      host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    })
  : null

// PostHog client-side initialization
export const initPostHogClient = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll handle this manually
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
      }
    })
  }
}

// Sentry initialization
export const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event) {
        // Filter out PII and sensitive data
        if (event.user) {
          delete event.user.email
          delete event.user.ip_address
        }
        
        // Remove sensitive request data
        if (event.request?.data) {
          const data = event.request.data
          if (typeof data === 'object') {
            delete data.password
            delete data.token
            delete data.apiKey
            delete data.secret
          }
        }
        
        return event
      },
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: undefined }),
      ],
    })
  }
}

// Event types for tracking
export type MonitoringEvent = 
  | 'agent_chat_started'
  | 'agent_chat_completed'
  | 'agent_chat_failed'
  | 'marketplace_share'
  | 'marketplace_download'
  | 'coach_onboarding_started'
  | 'coach_onboarding_completed'
  | 'subscription_upgraded'
  | 'subscription_cancelled'
  | 'security_login_attempt'
  | 'security_login_success'
  | 'security_login_failed'
  | 'security_2fa_enabled'
  | 'security_2fa_disabled'
  | 'rate_limit_exceeded'
  | 'api_error'
  | 'payment_success'
  | 'payment_failed'
  | 'tool_execution'
  | 'grok_heavy_upgrade'

export interface EventProperties {
  userId?: string
  sessionId?: string
  agentId?: string
  error?: string
  duration?: number
  toolName?: string
  revenue?: number
  planType?: string
  ipAddress?: string
  userAgent?: string
  [key: string]: any
}

// Security event logging (server-side only)
export async function logSecurityEvent(
  eventType: string,
  details: Record<string, any>,
  userId?: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  try {
    // Get request headers for context (without PII)
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'unknown'
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    
    // Hash IP address for privacy
    const hashedIp = await hashString(ipAddress)
    
    // Log to database
    await db.insert(security_events).values({
      eventType,
      severity,
      details: JSON.stringify({
        ...details,
        userAgent: userAgent.substring(0, 200), // Truncate long user agents
        hashedIp,
        timestamp: new Date().toISOString()
      }),
      userId,
      createdAt: new Date(),
    })
    
    // Send to Sentry for critical events
    if (severity === 'critical' || severity === 'high') {
      Sentry.addBreadcrumb({
        message: `Security Event: ${eventType}`,
        level: severity === 'critical' ? 'error' : 'warning',
        data: {
          eventType,
          severity,
          userId: userId ? `user_${userId.slice(-6)}` : undefined, // Partial ID only
        }
      })
      
      if (severity === 'critical') {
        Sentry.captureException(new Error(`Critical Security Event: ${eventType}`))
      }
    }
    
    console.log(`🔒 Security Event: ${eventType} (${severity})`, {
      userId: userId ? `user_${userId.slice(-6)}` : 'anonymous',
      hashedIp: hashedIp.slice(0, 8)
    })
    
  } catch (error) {
    console.error('Failed to log security event:', error)
    Sentry.captureException(error)
  }
}

// Track business events with PostHog
export async function trackEvent(
  event: MonitoringEvent,
  properties: EventProperties = {},
  userId?: string
) {
  try {
    // Server-side tracking
    if (posthogServer && userId) {
      posthogServer.capture({
        distinctId: userId,
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          source: 'server'
        }
      })
    }
    
    // Client-side tracking (if available)
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture(event, {
        ...properties,
        source: 'client'
      })
    }
    
    // Log important events to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Event: ${event}`, {
        userId: userId ? `user_${userId.slice(-6)}` : 'anonymous',
        properties: Object.keys(properties)
      })
    }
    
  } catch (error) {
    console.error('Failed to track event:', error)
    Sentry.captureException(error)
  }
}

// Error tracking with Sentry
export function captureError(
  error: Error,
  context?: Record<string, any>,
  userId?: string
) {
  try {
    Sentry.withScope((scope) => {
      if (userId) {
        scope.setUser({ id: userId })
      }
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value)
        })
      }
      
      scope.setLevel('error')
      Sentry.captureException(error)
    })
    
    console.error('🚨 Error captured:', error.message, {
      userId: userId ? `user_${userId.slice(-6)}` : 'anonymous',
      context: context ? Object.keys(context) : []
    })
    
  } catch (sentryError) {
    console.error('Failed to capture error with Sentry:', sentryError)
  }
}

// Performance monitoring
export function startTransaction(name: string, operation: string) {
  return Sentry.startTransaction({
    name,
    op: operation,
    tags: {
      environment: process.env.NODE_ENV
    }
  })
}

// Monitor API usage and overages
export async function checkAndAlertOverages(userId: string) {
  try {
    // Get user's current usage (this would integrate with your billing system)
    const usage = await getUserUsageThisMonth(userId)
    const subscription = await getUserSubscription(userId)
    
    if (!subscription) return
    
    const limits = getSubscriptionLimits(subscription.planType)
    
    // Check for overages
    const overages = {
      apiCalls: Math.max(0, usage.apiCalls - limits.apiCalls),
      agentDownloads: Math.max(0, usage.agentDownloads - limits.agentDownloads),
      agentShares: Math.max(0, usage.agentShares - limits.agentShares)
    }
    
    // Alert on significant overages (>80% over limit)
    Object.entries(overages).forEach(([metric, overage]) => {
      const limit = limits[metric as keyof typeof limits]
      if (overage > limit * 0.8) {
        // Track overage event
        trackEvent('subscription_overage', {
          userId,
          metric,
          overage,
          limit,
          planType: subscription.planType
        }, userId)
        
        // Send alert to Sentry
        Sentry.addBreadcrumb({
          message: `Usage Overage: ${metric}`,
          level: 'warning',
          data: { userId: `user_${userId.slice(-6)}`, metric, overage, limit }
        })
      }
    })
    
  } catch (error) {
    console.error('Failed to check overages:', error)
    captureError(error as Error, { userId, operation: 'overage_check' }, userId)
  }
}

// Admin logs query interface
export interface LogsFilter {
  eventType?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface LogsPagination {
  page: number
  limit: number
  sortBy: 'createdAt' | 'severity' | 'eventType'
  sortOrder: 'asc' | 'desc'
}

export async function getSecurityLogs(
  filters: LogsFilter = {},
  pagination: LogsPagination = {
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }
) {
  try {
    let query = db.select({
      id: security_events.id,
      eventType: security_events.eventType,
      severity: security_events.severity,
      details: security_events.details,
      userId: security_events.userId,
      createdAt: security_events.createdAt,
      // Join with users table for display name (without PII)
      userName: users.name
    })
    .from(security_events)
    .leftJoin(users, eq(security_events.userId, users.id))
    
    // Apply filters
    const conditions = []
    
    if (filters.eventType) {
      conditions.push(eq(security_events.eventType, filters.eventType))
    }
    
    if (filters.severity) {
      conditions.push(eq(security_events.severity, filters.severity))
    }
    
    if (filters.userId) {
      conditions.push(eq(security_events.userId, filters.userId))
    }
    
    if (filters.startDate) {
      conditions.push(gte(security_events.createdAt, filters.startDate))
    }
    
    if (filters.endDate) {
      conditions.push(lte(security_events.createdAt, filters.endDate))
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }
    
    // Apply sorting
    const sortColumn = security_events[pagination.sortBy]
    query = query.orderBy(
      pagination.sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn)
    )
    
    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit
    query = query.limit(pagination.limit).offset(offset)
    
    const logs = await query
    
    // Get total count for pagination
    const totalQuery = db.select({ count: count() }).from(security_events)
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions))
    }
    const [{ count: total }] = await totalQuery
    
    return {
      logs: logs.map(log => ({
        ...log,
        details: JSON.parse(log.details || '{}'),
        userName: log.userName || 'Unknown User'
      })),
      pagination: {
        ...pagination,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    }
    
  } catch (error) {
    console.error('Failed to fetch security logs:', error)
    captureError(error as Error, { operation: 'fetch_security_logs' })
    throw error
  }
}

// Get chat session analytics
export async function getChatSessionAnalytics(
  startDate: Date,
  endDate: Date,
  userId?: string
) {
  try {
    let query = db.select({
      date: sql<string>`DATE(${chat_sessions.createdAt})`,
      totalSessions: count(chat_sessions.id),
      uniqueUsers: sql<number>`COUNT(DISTINCT ${chat_sessions.userId})`,
      avgDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (${chat_sessions.updatedAt} - ${chat_sessions.createdAt})))`
    })
    .from(chat_sessions)
    .where(
      and(
        gte(chat_sessions.createdAt, startDate),
        lte(chat_sessions.createdAt, endDate),
        userId ? eq(chat_sessions.userId, userId) : undefined
      )
    )
    .groupBy(sql`DATE(${chat_sessions.createdAt})`)
    .orderBy(sql`DATE(${chat_sessions.createdAt})`)
    
    return await query
    
  } catch (error) {
    console.error('Failed to fetch chat analytics:', error)
    captureError(error as Error, { operation: 'fetch_chat_analytics' })
    throw error
  }
}

// Utility functions
async function hashString(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for environments without crypto.subtle
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

// Mock functions - replace with actual implementations
async function getUserUsageThisMonth(userId: string) {
  // This should integrate with your actual usage tracking
  return {
    apiCalls: 1500,
    agentDownloads: 25,
    agentShares: 10
  }
}

async function getUserSubscription(userId: string) {
  // This should integrate with your subscription system
  return {
    planType: 'pro',
    status: 'active'
  }
}

function getSubscriptionLimits(planType: string) {
  const limits = {
    free: { apiCalls: 1000, agentDownloads: 5, agentShares: 10 },
    pro: { apiCalls: 10000, agentDownloads: 50, agentShares: 100 },
    enterprise: { apiCalls: 100000, agentDownloads: 500, agentShares: 1000 },
    grok_heavy: { apiCalls: 500000, agentDownloads: 1000, agentShares: 2000 }
  }
  
  return limits[planType as keyof typeof limits] || limits.free
}

// Flush PostHog events (call this on app shutdown)
export async function flushEvents() {
  if (posthogServer) {
    await posthogServer.shutdown()
  }
}

// Export PostHog client for direct use
export { posthog }
