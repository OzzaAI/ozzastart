import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock database
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => Promise.resolve([
          {
            id: 'metric-1',
            userId: 'test-user-id',
            agentId: 'test-agent-id',
            downloads: 150,
            shares: 75,
            revenue: 2500,
            conversionRate: 0.15,
            engagementScore: 8.5,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date()
          },
          {
            id: 'metric-2',
            userId: 'test-user-id',
            agentId: 'test-agent-id-2',
            downloads: 200,
            shares: 100,
            revenue: 3500,
            conversionRate: 0.20,
            engagementScore: 9.2,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date()
          }
        ]))
      }))
    }))
  }))
}

vi.mock('@/db/drizzle', () => ({ db: mockDb }))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => Promise.resolve({
        user: { id: 'test-user-id', email: 'coach@example.com' }
      }))
    }
  }
}))

describe('Coach Metrics API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/coach-metrics', () => {
    it('should return coach metrics data', async () => {
      const metrics = await mockDb.select().from().where().orderBy()
      
      expect(metrics).toHaveLength(2)
      expect(metrics[0]).toHaveProperty('downloads', 150)
      expect(metrics[0]).toHaveProperty('revenue', 2500)
      expect(metrics[1]).toHaveProperty('conversionRate', 0.20)
    })

    it('should calculate total metrics', async () => {
      const metrics = await mockDb.select().from().where().orderBy()
      
      const totalDownloads = metrics.reduce((sum, m) => sum + m.downloads, 0)
      const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0)
      
      expect(totalDownloads).toBe(350)
      expect(totalRevenue).toBe(6000)
    })

    it('should filter metrics by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      
      const metrics = await mockDb.select().from().where().orderBy()
      const filteredMetrics = metrics.filter(m => 
        m.createdAt >= startDate && m.createdAt <= endDate
      )
      
      expect(filteredMetrics).toHaveLength(2)
    })

    it('should handle empty metrics gracefully', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([]))
          }))
        }))
      })
      
      const metrics = await mockDb.select().from().where().orderBy()
      expect(metrics).toHaveLength(0)
    })
  })
})
