// Monitoring and analytics utilities for Ozza-Reboot
import * as React from 'react';
// Supports PostHog, Sentry, and custom event tracking

interface EventProperties {
  [key: string]: any
}

interface UserProperties {
  id?: string
  email?: string
  name?: string
  locale?: string
  plan?: string
  [key: string]: any
}

// PostHog Analytics
export async function trackEvent(
  eventName: string,
  properties: EventProperties = {},
  userId?: string
): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.posthog) {
      const eventData = {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        locale: navigator.language,
      }

      if (userId) {
        window.posthog.identify(userId)
      }

      window.posthog.capture(eventName, eventData)
    }
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

export async function identifyUser(userId: string, properties: UserProperties = {}): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.identify(userId, {
        ...properties,
        lastSeen: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Failed to identify user:', error)
  }
}

export async function setUserProperties(properties: UserProperties): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.people.set(properties)
    }
  } catch (error) {
    console.error('Failed to set user properties:', error)
  }
}

// Sentry Error Tracking
export function captureError(error: Error, context: Record<string, any> = {}): void {
  try {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: context.component || 'unknown',
          action: context.action || 'unknown',
        },
        extra: {
          ...context,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        },
      })
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Captured error:', error, context)
    }
  } catch (err) {
    console.error('Failed to capture error:', err)
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  try {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage(message, level)
    }
  } catch (error) {
    console.error('Failed to capture message:', error)
  }
}

// Performance Monitoring
export function startPerformanceTimer(name: string): () => number {
  const startTime = performance.now()
  
  return () => {
    const duration = performance.now() - startTime
    
    trackEvent('performance_metric', {
      metric_name: name,
      duration_ms: duration,
      category: 'performance',
    })
    
    return duration
  }
}

export function measureAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const endTimer = startPerformanceTimer(name)
  
  return operation()
    .then(result => {
      endTimer()
      return result
    })
    .catch(error => {
      endTimer()
      captureError(error, { operation: name })
      throw error
    })
}

// Accessibility Event Tracking
export async function trackAccessibilityEvent(
  eventType: 'keyboard_navigation' | 'screen_reader' | 'high_contrast' | 'reduced_motion' | 'language_change',
  properties: EventProperties = {}
): Promise<void> {
  await trackEvent('accessibility_event', {
    event_type: eventType,
    ...properties,
    category: 'accessibility',
  })
}

export async function trackLanguageChange(
  fromLocale: string,
  toLocale: string,
  method: 'auto_detect' | 'user_selection' | 'url_param' = 'user_selection'
): Promise<void> {
  await trackEvent('language_changed', {
    from_locale: fromLocale,
    to_locale: toLocale,
    change_method: method,
    category: 'i18n',
  })
}

// Grok 4 Specific Tracking
export async function trackGrokEvent(
  eventType: 'chat_started' | 'tool_executed' | 'parallel_execution' | 'structured_output' | 'context_window_used',
  properties: EventProperties = {}
): Promise<void> {
  await trackEvent('grok4_event', {
    event_type: eventType,
    ...properties,
    category: 'ai',
    model: 'grok-4',
  })
}

// Coach Mode Tracking
export async function trackCoachEvent(
  eventType: 'metrics_viewed' | 'roi_calculated' | 'goal_set' | 'recommendation_followed',
  properties: EventProperties = {}
): Promise<void> {
  await trackEvent('coach_event', {
    event_type: eventType,
    ...properties,
    category: 'coach',
  })
}

// Marketplace Tracking
export async function trackMarketplaceEvent(
  eventType: 'agent_viewed' | 'agent_installed' | 'agent_shared' | 'agent_published',
  properties: EventProperties = {}
): Promise<void> {
  await trackEvent('marketplace_event', {
    event_type: eventType,
    ...properties,
    category: 'marketplace',
  })
}

// Security Event Logging
export interface SecurityEvent {
  type: 'login_attempt' | 'failed_login' | 'unauthorized_access' | 'suspicious_activity' | 'rate_limit_exceeded'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ipAddress?: string
  userAgent?: string
  details: Record<string, any>
}

export async function logSecurityEvent(
  type: SecurityEvent['type'],
  details: Record<string, any>,
  userId?: string,
  severity: SecurityEvent['severity'] = 'medium'
): Promise<void> {
  const event: SecurityEvent = {
    type,
    severity,
    userId,
    details: {
      ...details,
      timestamp: new Date().toISOString(),
    },
  }

  // Track in analytics
  await trackEvent('security_event', {
    security_type: type,
    severity,
    user_id: userId,
    ...details,
    category: 'security',
  })

  // Log to server (implement server-side logging)
  try {
    await fetch('/api/security/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
    captureError(error as Error, { context: 'security_logging', event })
  }
}

// Feature Flag Support
export function isFeatureEnabled(featureName: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.posthog) {
      return window.posthog.isFeatureEnabled(featureName) || false
    }
  } catch (error) {
    console.error('Failed to check feature flag:', error)
  }
  return false
}

// Page View Tracking
export async function trackPageView(
  path: string,
  properties: EventProperties = {}
): Promise<void> {
  await trackEvent('page_view', {
    path,
    ...properties,
    category: 'navigation',
  })
}

// Conversion Tracking
export async function trackConversion(
  conversionType: string,
  value?: number,
  properties: EventProperties = {}
): Promise<void> {
  await trackEvent('conversion', {
    conversion_type: conversionType,
    value,
    ...properties,
    category: 'conversion',
  })
}

// Error Boundary Integration
export function withErrorBoundary<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
): React.ComponentType<T> {
  return function WrappedComponent(props: T) {
    React.useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        captureError(new Error(error.message), {
          component: componentName,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
        })
      }

      window.addEventListener('error', handleError)
      return () => window.removeEventListener('error', handleError)
    }, [])

    return React.createElement(Component, props)
  }
}

// Utility to filter PII from event data
export function sanitizeEventData(data: Record<string, any>): Record<string, any> {
  const piiFields = ['email', 'password', 'ssn', 'phone', 'address', 'creditCard']
  const sanitized = { ...data }

  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Mask email addresses
      if (value.includes('@')) {
        return value.replace(/(.{2}).*@(.*)/, '$1***@$2')
      }
      // Mask potential phone numbers
      if (/^\+?[\d\s\-\(\)]{10,}$/.test(value)) {
        return '***-***-****'
      }
    }
    return value
  }

  Object.keys(sanitized).forEach(key => {
    if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = sanitizeValue(sanitized[key])
    }
  })

  return sanitized
}

// Stub implementations for server-side analytics used by API routes
export async function getChatSessionAnalytics() {
  return [];
}

export async function getSecurityLogs() {
  return [];
}

// Type declarations for global objects
declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void
      identify: (userId: string, properties?: Record<string, any>) => void
      people: {
        set: (properties: Record<string, any>) => void
      }
      isFeatureEnabled: (feature: string) => boolean
    }
    Sentry?: {
      captureException: (error: Error, context?: any) => void
      captureMessage: (message: string, level?: string) => void
    }
  }
}
