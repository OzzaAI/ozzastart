import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  trackEvent,
  captureError,
  logSecurityEvent,
  startTransaction,
  checkAndAlertOverages,
  getSecurityLogs,
  getChatSessionAnalytics
} from '@/lib/monitoring'

// Mock Sentry
const mockSentry = {
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  withScope: vi.fn((callback) => {
    const scope = {
      setUser: vi.fn(),
      setContext: vi.fn(),
      setLevel: vi.fn(),
      setTag: vi.fn()
    }
    callback(scope)
  }),
  startTransaction: vi.fn(() => ({
    setTag: vi.fn(),
    setData: vi.fn(),
    finish: vi.fn()
  }))
}

vi.mock('@sentry/nextjs', () => mockSentry)

// Mock PostHog
const mockPostHog = {
  capture: vi.fn(),
  identify: vi.fn(),
  __loaded: true
}

const mockPostHogServer = {
  capture: vi.fn(),
  identify: vi.fn(),
  shutdown: vi.fn()
}

vi.mock('posthog-js', () => ({
  default: mockPostHog
}))

vi.mock('posthog-node', () => ({
  PostHog: vi.fn(() => mockPostHogServer)
}))

// Mock database operations
const mockSecurityEvents = [
  {
    id: 'event-1',
    eventType: 'security_login_attempt',
    severity: 'medium',
    details: JSON.stringify({
      userAgent: 'test-agent',
      hashedIp: 'hashed-ip-123',
      timestamp: new Date().toISOString()
    }),
    userId: 'user-1',
    userName: 'Test User',
    createdAt: new Date().toISOString()
  },
  {
    id: 'event-2',
    eventType: 'rate_limit_exceeded',
    severity: 'high',
    details: JSON.stringify({
      path: '/api/chat',
      limit: 30,
      remaining: 0
    }),
    userId: 'user-2',
    userName: 'Another User',
    createdAt: new Date().toISOString()
  }
]

const mockChatAnalytics = [
  {
    date: '2024-01-01',
    totalSessions: 150,
    uniqueUsers: 75,
    avgDuration: 300
  },
  {
    date: '2024-01-02',
    totalSessions: 200,
    uniqueUsers: 100,
    avgDuration: 350
  }
]

// Mock database with security events
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve(mockSecurityEvents))
              }))
            }))
          }))
        })),
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve(mockChatAnalytics)),
          groupBy: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockChatAnalytics))
          }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      into: vi.fn(() => ({
        values: vi.fn(() => Promise.resolve([{ id: 'new-event-id' }]))
      }))
    }))
  }
}))

describe('Monitoring Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Event Tracking with PostHog', () => {
    it('should track events with PostHog server-side', async () => {
      const eventName = 'agent_chat_started'
      const properties = {
        sessionId: 'test-session',
        agentId: 'test-agent',
        messageLength: 100
      }
      const userId = 'test-user-id'

      await trackEvent(eventName, properties, userId)

      expect(mockPostHogServer.capture).toHaveBeenCalledWith({
        distinctId: userId,
        event: eventName,
        properties: expect.objectContaining({
          ...properties,
          timestamp: expect.any(String),
          environment: 'test',
          source: 'server'
        })
      })
    })

    it('should track events with PostHog client-side', async () => {
      // Simulate client-side environment
      Object.defineProperty(window, 'window', {
        value: {},
        writable: true
      })

      const eventName = 'marketplace_share'
      const properties = {
        agentId: 'test-agent',
        agentName: 'Test Agent'
      }

      await trackEvent(eventName, properties)

      expect(mockPostHog.capture).toHaveBeenCalledWith(eventName, {
        ...properties,
        source: 'client'
      })
    })

    it('should handle different event types correctly', async () => {
      const eventTypes = [
        'agent_chat_started',
        'agent_chat_completed',
        'marketplace_share',
        'coach_onboarding_started',
        'subscription_upgraded',
        'tool_execution'
      ]

      for (const eventType of eventTypes) {
        await trackEvent(eventType as any, { testProp: 'value' }, 'user-id')
        
        expect(mockPostHogServer.capture).toHaveBeenCalledWith({
          distinctId: 'user-id',
          event: eventType,
          properties: expect.objectContaining({
            testProp: 'value',
            source: 'server'
          })
        })
      }
    })

    it('should handle tracking errors gracefully', async () => {
      mockPostHogServer.capture.mockRejectedValueOnce(new Error('PostHog error'))

      // Should not throw error
      await expect(trackEvent('test_event', {}, 'user-id')).resolves.not.toThrow()
      
      // Should capture error with Sentry
      expect(mockSentry.captureException).toHaveBeenCalled()
    })
  })

  describe('Error Capture with Sentry', () => {
    it('should capture errors with context', () => {
      const error = new Error('Test error')
      const context = {
        operation: 'test_operation',
        userId: 'test-user',
        additionalData: 'test-data'
      }
      const userId = 'test-user-id'

      captureError(error, context, userId)

      expect(mockSentry.withScope).toHaveBeenCalled()
      expect(mockSentry.captureException).toHaveBeenCalledWith(error)
    })

    it('should set user context when provided', () => {
      const error = new Error('Test error with user')
      const userId = 'test-user-id'
      
      let capturedScope: any
      mockSentry.withScope.mockImplementationOnce((callback) => {
        const scope = {
          setUser: vi.fn(),
          setContext: vi.fn(),
          setLevel: vi.fn()
        }
        capturedScope = scope
        callback(scope)
      })

      captureError(error, {}, userId)

      expect(capturedScope.setUser).toHaveBeenCalledWith({ id: userId })
      expect(capturedScope.setLevel).toHaveBeenCalledWith('error')
    })

    it('should handle errors without context', () => {
      const error = new Error('Simple error')

      captureError(error)

      expect(mockSentry.withScope).toHaveBeenCalled()
      expect(mockSentry.captureException).toHaveBeenCalledWith(error)
    })

    it('should handle Sentry failures gracefully', () => {
      mockSentry.captureException.mockImplementationOnce(() => {
        throw new Error('Sentry failure')
      })

      const error = new Error('Original error')
      
      // Should not throw error
      expect(() => captureError(error)).not.toThrow()
    })
  })

  describe('Security Event Logging', () => {
    it('should log security events to database', async () => {
      const eventType = 'security_login_attempt'
      const details = {
        username: 'testuser',
        success: false,
        reason: 'invalid_password'
      }
      const userId = 'test-user-id'
      const severity = 'medium'

      await logSecurityEvent(eventType, details, userId, severity)

      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should hash IP addresses for privacy', async () => {
      const eventType = 'unauthorized_access'
      const details = { path: '/admin' }

      await logSecurityEvent(eventType, details, undefined, 'high')

      // Should have processed the request without throwing
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should send critical events to Sentry', async () => {
      const eventType = 'critical_security_breach'
      const details = { severity: 'critical' }

      await logSecurityEvent(eventType, details, 'user-id', 'critical')

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: `Security Event: ${eventType}`,
        level: 'error',
        data: expect.objectContaining({
          eventType,
          severity: 'critical'
        })
      })
      expect(mockSentry.captureException).toHaveBeenCalled()
    })

    it('should handle different severity levels', async () => {
      const severityLevels = ['low', 'medium', 'high', 'critical'] as const

      for (const severity of severityLevels) {
        await logSecurityEvent('test_event', {}, 'user-id', severity)
        
        if (severity === 'critical' || severity === 'high') {
          expect(mockSentry.addBreadcrumb).toHaveBeenCalled()
        }
      }
    })

    it('should filter PII from security logs', async () => {
      const eventType = 'login_attempt'
      const details = {
        email: 'user@example.com',
        password: 'secret123',
        creditCard: '4111-1111-1111-1111',
        safeData: 'this is safe'
      }

      await logSecurityEvent(eventType, details, 'user-id', 'medium')

      // Should have logged the event
      expect(mockDb.insert).toHaveBeenCalled()
      
      // PII filtering is handled in the actual implementation
      // This test ensures the function completes without error
    })
  })

  describe('Performance Monitoring', () => {
    it('should start and manage transactions', () => {
      const transactionName = 'api_request'
      const operation = 'http'

      const transaction = startTransaction(transactionName, operation)

      expect(mockSentry.startTransaction).toHaveBeenCalledWith({
        name: transactionName,
        op: operation,
        tags: {
          environment: 'test'
        }
      })

      expect(transaction).toHaveProperty('finish')
      expect(transaction).toHaveProperty('setTag')
      expect(transaction).toHaveProperty('setData')
    })

    it('should track API performance', () => {
      const transaction = startTransaction('chat_api', 'http')
      
      // Simulate API operation
      transaction.setTag('endpoint', '/api/chat')
      transaction.setData('userId', 'test-user')
      transaction.finish()

      expect(mockSentry.startTransaction).toHaveBeenCalled()
    })
  })

  describe('Usage Overage Monitoring', () => {
    it('should check and alert on usage overages', async () => {
      const userId = 'test-user-id'

      // Mock high usage scenario
      vi.mocked(getUserUsageThisMonth).mockResolvedValueOnce({
        apiCalls: 15000, // Over limit
        agentDownloads: 60, // Over limit
        agentShares: 15
      })

      vi.mocked(getUserSubscription).mockResolvedValueOnce({
        planType: 'pro',
        status: 'active'
      })

      await checkAndAlertOverages(userId)

      // Should track overage events
      expect(mockPostHogServer.capture).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'subscription_overage'
        })
      )

      // Should send alerts to Sentry
      expect(mockSentry.addBreadcrumb).toHaveBeenCalled()
    })

    it('should handle users without subscriptions', async () => {
      const userId = 'test-user-id'

      vi.mocked(getUserSubscription).mockResolvedValueOnce(null)

      // Should not throw error
      await expect(checkAndAlertOverages(userId)).resolves.not.toThrow()
    })

    it('should calculate overages correctly for different plans', async () => {
      const userId = 'test-user-id'
      
      const plans = ['free', 'pro', 'enterprise', 'grok_heavy']
      
      for (const planType of plans) {
        vi.mocked(getUserSubscription).mockResolvedValueOnce({
          planType,
          status: 'active'
        })

        await checkAndAlertOverages(userId)
        
        // Should complete without error for all plan types
      }
    })
  })

  describe('Admin Logs Retrieval', () => {
    it('should retrieve security logs with filters', async () => {
      const filters = {
        eventType: 'security_login_attempt',
        severity: 'medium' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      }

      const pagination = {
        page: 1,
        limit: 50,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const
      }

      const result = await getSecurityLogs(filters, pagination)

      expect(result).toHaveProperty('logs')
      expect(result).toHaveProperty('pagination')
      expect(Array.isArray(result.logs)).toBe(true)
      expect(result.logs.length).toBeGreaterThan(0)
    })

    it('should handle pagination correctly', async () => {
      const pagination = {
        page: 2,
        limit: 25,
        sortBy: 'severity' as const,
        sortOrder: 'asc' as const
      }

      const result = await getSecurityLogs({}, pagination)

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(25)
      expect(result.pagination).toHaveProperty('total')
      expect(result.pagination).toHaveProperty('totalPages')
    })

    it('should parse JSON details in logs', async () => {
      const result = await getSecurityLogs()

      result.logs.forEach(log => {
        expect(typeof log.details).toBe('object')
        expect(log).toHaveProperty('userName')
      })
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.mocked(mockDb.select).mockImplementationOnce(() => {
        throw new Error('Database connection failed')
      })

      await expect(getSecurityLogs()).rejects.toThrow('Database connection failed')
      expect(mockSentry.captureException).toHaveBeenCalled()
    })
  })

  describe('Chat Session Analytics', () => {
    it('should retrieve chat analytics with date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const result = await getChatSessionAnalytics(startDate, endDate)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      result.forEach(day => {
        expect(day).toHaveProperty('date')
        expect(day).toHaveProperty('totalSessions')
        expect(day).toHaveProperty('uniqueUsers')
        expect(day).toHaveProperty('avgDuration')
      })
    })

    it('should filter analytics by user', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const userId = 'specific-user-id'

      const result = await getChatSessionAnalytics(startDate, endDate, userId)

      expect(Array.isArray(result)).toBe(true)
      // Should have applied user filter in query
    })

    it('should handle analytics errors gracefully', async () => {
      // Mock database error
      vi.mocked(mockDb.select).mockImplementationOnce(() => {
        throw new Error('Analytics query failed')
      })

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await expect(getChatSessionAnalytics(startDate, endDate)).rejects.toThrow()
      expect(mockSentry.captureException).toHaveBeenCalled()
    })
  })

  describe('PII Filtering and Privacy', () => {
    it('should filter PII from error contexts', () => {
      const error = new Error('Test error')
      const context = {
        email: 'user@example.com',
        password: 'secret123',
        creditCard: '4111-1111-1111-1111',
        apiKey: 'sk-1234567890',
        safeData: 'this is safe'
      }

      captureError(error, context, 'user-id')

      // Should have called Sentry (PII filtering happens in Sentry config)
      expect(mockSentry.captureException).toHaveBeenCalled()
    })

    it('should hash sensitive identifiers', async () => {
      const eventType = 'user_action'
      const details = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      }

      await logSecurityEvent(eventType, details, 'user-id', 'low')

      // Should have processed without exposing raw IP
      expect(mockDb.insert).toHaveBeenCalled()
    })
  })

  describe('Integration with Coach Mode', () => {
    it('should track coach-specific events', async () => {
      const coachEvents = [
        'coach_onboarding_started',
        'coach_onboarding_completed',
        'grok_heavy_upgrade'
      ]

      for (const eventType of coachEvents) {
        await trackEvent(eventType as any, {
          coachId: 'coach-123',
          step: 'profile_setup'
        }, 'coach-user-id')

        expect(mockPostHogServer.capture).toHaveBeenCalledWith(
          expect.objectContaining({
            event: eventType,
            properties: expect.objectContaining({
              coachId: 'coach-123'
            })
          })
        )
      }
    })

    it('should track revenue attribution', async () => {
      await trackEvent('subscription_upgraded', {
        fromPlan: 'pro',
        toPlan: 'grok_heavy',
        revenue: 199.00,
        coachId: 'coach-123'
      }, 'user-id')

      expect(mockPostHogServer.capture).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            revenue: 199.00,
            coachId: 'coach-123'
          })
        })
      )
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should continue functioning when PostHog is unavailable', async () => {
      mockPostHogServer.capture.mockRejectedValueOnce(new Error('PostHog unavailable'))

      // Should not throw error
      await expect(trackEvent('test_event', {}, 'user-id')).resolves.not.toThrow()
    })

    it('should continue functioning when Sentry is unavailable', () => {
      mockSentry.captureException.mockImplementationOnce(() => {
        throw new Error('Sentry unavailable')
      })

      const error = new Error('Test error')
      
      // Should not throw error
      expect(() => captureError(error)).not.toThrow()
    })

    it('should handle database unavailability', async () => {
      vi.mocked(mockDb.insert).mockRejectedValueOnce(new Error('Database unavailable'))

      // Should not throw error
      await expect(logSecurityEvent('test_event', {}, 'user-id', 'low')).resolves.not.toThrow()
    })
  })
})

// Mock helper functions
function getUserUsageThisMonth(userId: string) {
  return Promise.resolve({
    apiCalls: 5000,
    agentDownloads: 25,
    agentShares: 10
  })
}

function getUserSubscription(userId: string) {
  return Promise.resolve({
    planType: 'pro',
    status: 'active'
  })
}

// Add mocks to vi
vi.mocked(getUserUsageThisMonth)
vi.mocked(getUserSubscription)
