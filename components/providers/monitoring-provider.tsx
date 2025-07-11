'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { initPostHogClient, posthog } from '@/lib/monitoring'
import { usePathname, useSearchParams } from 'next/navigation'

interface MonitoringContextType {
  trackEvent: (event: string, properties?: Record<string, any>) => void
  identifyUser: (userId: string, properties?: Record<string, any>) => void
  trackPageView: (path?: string) => void
}

const MonitoringContext = createContext<MonitoringContextType | null>(null)

interface MonitoringProviderProps {
  children: ReactNode
  userId?: string
  userEmail?: string
}

export function MonitoringProvider({ children, userId, userEmail }: MonitoringProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize PostHog
    initPostHogClient()
  }, [])

  useEffect(() => {
    // Identify user when userId changes
    if (userId && typeof window !== 'undefined' && posthog.__loaded) {
      posthog.identify(userId, {
        email: userEmail,
        // Add other user properties as needed
      })
    }
  }, [userId, userEmail])

  useEffect(() => {
    // Track page views
    if (typeof window !== 'undefined' && posthog.__loaded) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      posthog.capture('$pageview', {
        $current_url: url,
        path: pathname
      })
    }
  }, [pathname, searchParams])

  const trackEvent = (event: string, properties: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
        source: 'client'
      })
    }
  }

  const identifyUser = (userId: string, properties: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.identify(userId, properties)
    }
  }

  const trackPageView = (path?: string) => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture('$pageview', {
        $current_url: path || window.location.href,
        path: path || pathname
      })
    }
  }

  const value: MonitoringContextType = {
    trackEvent,
    identifyUser,
    trackPageView
  }

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  )
}

export function useMonitoring() {
  const context = useContext(MonitoringContext)
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider')
  }
  return context
}

// Hook for tracking specific events
export function useEventTracking() {
  const { trackEvent } = useMonitoring()

  return {
    trackAgentChat: (agentId?: string, sessionId?: string) => {
      trackEvent('agent_chat_started', { agentId, sessionId })
    },
    
    trackMarketplaceShare: (agentId: string, agentName: string) => {
      trackEvent('marketplace_share', { agentId, agentName })
    },
    
    trackMarketplaceDownload: (agentId: string, agentName: string) => {
      trackEvent('marketplace_download', { agentId, agentName })
    },
    
    trackCoachOnboarding: (step: string) => {
      trackEvent('coach_onboarding_step', { step })
    },
    
    trackSubscriptionUpgrade: (fromPlan: string, toPlan: string) => {
      trackEvent('subscription_upgraded', { fromPlan, toPlan })
    },
    
    trackToolUsage: (toolName: string, success: boolean, duration?: number) => {
      trackEvent('tool_execution', { toolName, success, duration })
    },
    
    trackError: (error: string, context?: Record<string, any>) => {
      trackEvent('client_error', { error, ...context })
    }
  }
}
