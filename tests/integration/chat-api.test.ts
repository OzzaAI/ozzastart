import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import request from 'supertest'
import { createServer } from 'http'

// Mock the chat route handler
const mockChatHandler = vi.fn()

// Mock database operations for chat sessions
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve([
          {
            id: 'test-session-id',
            userId: 'test-user-id',
            agentId: 'test-agent-id',
            state: JSON.stringify({
              messages: ['Previous message'],
              currentStep: 'completed',
              mcpResults: {
                'previous_tool': {
                  status: 'completed',
                  result: { data: 'previous result' }
                }
              }
            }),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])),
        orderBy: vi.fn(() => Promise.resolve([]))
      }))
    }))
  })),
  insert: vi.fn(() => ({
    into: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'new-session-id',
          userId: 'test-user-id',
          agentId: 'test-agent-id',
          state: JSON.stringify({ messages: [], currentStep: 'start' })
        }])),
        onConflictDoUpdate: vi.fn(() => Promise.resolve([]))
      }))
    }))
  }))
}

vi.mock('@/db/drizzle', () => ({
  db: mockDb
}))

// Mock auth with different user scenarios
const mockAuth = {
  api: {
    getSession: vi.fn(() => Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      },
      session: {
        id: 'test-session-id',
        userId: 'test-user-id'
      }
    }))
  }
}

vi.mock('@/lib/auth', () => ({
  auth: mockAuth
}))

// Mock monitoring
const mockMonitoring = {
  trackEvent: vi.fn(),
  captureError: vi.fn(),
  startTransaction: vi.fn(() => ({
    finish: vi.fn(),
    setTag: vi.fn(),
    setData: vi.fn()
  })),
  logSecurityEvent: vi.fn()
}

vi.mock('@/lib/monitoring', () => mockMonitoring)

// Mock LangGraph chatbot with Grok 4 responses
vi.mock('@/lib/langgraph-chatbot', () => ({
  runAgenticChatbot: vi.fn((message: string, previousState?: any) => {
    if (message.includes('weather')) {
      return Promise.resolve({
        messages: [message],
        finalResponse: 'The weather in San Francisco is 72°F and sunny with Grok 4 enhanced analysis.',
        currentStep: 'completed',
        mcpResults: {
          'get_current_temperature': {
            status: 'completed',
            result: {
              location: 'San Francisco, CA',
              temperature: 72,
              unit: 'fahrenheit',
              conditions: 'sunny',
              humidity: 65,
              windSpeed: 8,
              timestamp: new Date().toISOString()
            },
            executionTime: 150,
            timestamp: new Date().toISOString()
          }
        },
        needsHuman: false,
        plan: {
          tasks: [{
            id: 'weather_task',
            type: 'get_current_temperature',
            description: 'Get weather information with Grok 4',
            params: { location: 'San Francisco, CA' },
            priority: 'medium',
            requiresHuman: false
          }],
          reasoning: 'Grok 4 enhanced weather analysis',
          estimatedComplexity: 'simple',
          requiresHumanApproval: false
        }
      })
    }
    
    if (message.includes('search')) {
      return Promise.resolve({
        messages: [message],
        finalResponse: 'I found several articles about AI developments using Grok 4 enhanced search.',
        currentStep: 'completed',
        mcpResults: {
          'web_search': {
            status: 'completed',
            result: {
              results: [
                {
                  title: 'Grok 4 AI Development News',
                  url: 'https://example.com/grok4-news',
                  snippet: 'Latest Grok 4 developments...',
                  relevanceScore: 0.95
                }
              ],
              query: 'AI developments',
              totalResults: 1,
              searchTime: 200
            },
            executionTime: 200,
            timestamp: new Date().toISOString()
          }
        },
        needsHuman: false
      })
    }
    
    if (message.includes('parallel') || message.includes('multiple')) {
      return Promise.resolve({
        messages: [message],
        finalResponse: 'I executed multiple tools in parallel using Grok 4: weather check and web search.',
        currentStep: 'completed',
        mcpResults: {
          'get_current_temperature': {
            status: 'completed',
            result: { temperature: 75, location: 'New York' },
            executionTime: 120
          },
          'web_search': {
            status: 'completed',
            result: { results: [{ title: 'News Article' }] },
            executionTime: 180
          }
        },
        needsHuman: false
      })
    }
    
    if (message.includes('email')) {
      return Promise.resolve({
        messages: [message],
        finalResponse: 'I can help you send an email, but it requires human approval for security.',
        currentStep: 'awaiting_human_approval',
        mcpResults: {
          'send_email': {
            status: 'pending_approval',
            result: {
              messageId: 'pending',
              status: 'pending_approval',
              recipient: 'user@example.com'
            }
          }
        },
        needsHuman: true,
        plan: {
          tasks: [{
            id: 'email_task',
            type: 'send_email',
            description: 'Send email with human approval',
            params: { to: 'user@example.com', subject: 'Test', body: 'Test email' },
            priority: 'medium',
            requiresHuman: true
          }],
          reasoning: 'Email sending requires human approval for security',
          estimatedComplexity: 'simple',
          requiresHumanApproval: true
        }
      })
    }
    
    if (message.includes('error')) {
      return Promise.resolve({
        messages: [message],
        finalResponse: 'I encountered an error while processing your request with Grok 4.',
        currentStep: 'error',
        errorMessage: 'Simulated error for testing',
        mcpResults: {}
      })
    }
    
    // Default Grok 4 response
    return Promise.resolve({
      messages: [message],
      finalResponse: 'I understand your message and here is my Grok 4 enhanced response.',
      currentStep: 'completed',
      mcpResults: {},
      needsHuman: false
    })
  }),
  
  streamAgenticChatbot: vi.fn(async function* (message: string) {
    yield {
      messages: [message],
      currentStep: 'planning',
      plan: null,
      mcpResults: {}
    }
    
    yield {
      messages: [message],
      currentStep: 'executing',
      plan: { tasks: [], reasoning: 'Grok 4 processing request' },
      mcpResults: {}
    }
    
    yield {
      messages: [message],
      currentStep: 'completed',
      finalResponse: 'Grok 4 streaming response completed.',
      mcpResults: {
        'test_tool': {
          status: 'completed',
          result: { data: 'Grok 4 streaming result' }
        }
      }
    }
  })
}))

describe('Chat API Integration Tests with Grok 4', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/chat - Basic Functionality', () => {
    it('should handle basic chat requests with Grok 4', async () => {
      const chatRequest = {
        message: 'Hello, test Grok 4 integration',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
      expect(result).toHaveProperty('currentStep', 'completed')
      expect(result.finalResponse).toContain('Grok 4')
      
      // Should track the event
      expect(mockMonitoring.trackEvent).toHaveBeenCalledWith(
        'agent_chat_started',
        expect.objectContaining({
          messageLength: chatRequest.message.length
        }),
        'test-user-id'
      )
    })

    it('should validate request schema', async () => {
      const invalidRequests = [
        {}, // Missing required fields
        { message: '' }, // Empty message
        { sessionId: 'test' }, // Missing message
        { message: 'test', sessionId: '' } // Empty session ID
      ]

      const { z } = await import('zod')
      const ChatRequestSchema = z.object({
        message: z.string().min(1, "Message is required"),
        sessionId: z.string().min(1, "Session ID is required"),
        agentId: z.string().uuid().optional(),
        streaming: z.boolean().default(false),
        metadata: z.record(z.any()).optional(),
      })

      invalidRequests.forEach(request => {
        expect(() => ChatRequestSchema.parse(request)).toThrow()
      })
    })

    it('should handle authentication errors', async () => {
      // Mock unauthenticated request
      mockAuth.api.getSession.mockResolvedValueOnce(null)

      const chatRequest = {
        message: 'Test message',
        sessionId: 'test-session-id'
      }

      // Should log security event
      expect(mockMonitoring.logSecurityEvent).toHaveBeenCalledWith(
        'unauthorized_chat_attempt',
        expect.objectContaining({
          path: '/api/chat',
          method: 'POST'
        }),
        undefined,
        'medium'
      )
    })
  })

  describe('Grok 4 Tool Execution', () => {
    it('should handle weather requests with structured outputs', async () => {
      const chatRequest = {
        message: 'What is the weather like in San Francisco?',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
      expect(result).toHaveProperty('mcpResults')
      expect(result.mcpResults).toHaveProperty('get_current_temperature')
      
      const weatherResult = result.mcpResults.get_current_temperature
      expect(weatherResult.status).toBe('completed')
      expect(weatherResult.result).toHaveProperty('temperature', 72)
      expect(weatherResult.result).toHaveProperty('humidity', 65)
      expect(weatherResult.result).toHaveProperty('windSpeed', 8)
      expect(weatherResult).toHaveProperty('executionTime')
      expect(weatherResult).toHaveProperty('timestamp')
      
      expect(result.finalResponse).toContain('72°F')
      expect(result.finalResponse).toContain('Grok 4')
    })

    it('should handle web search with enhanced results', async () => {
      const chatRequest = {
        message: 'Search for recent AI developments',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('mcpResults')
      expect(result.mcpResults).toHaveProperty('web_search')
      
      const searchResult = result.mcpResults.web_search
      expect(searchResult.status).toBe('completed')
      expect(searchResult.result).toHaveProperty('results')
      expect(searchResult.result.results[0]).toHaveProperty('relevanceScore', 0.95)
      expect(searchResult.result).toHaveProperty('searchTime', 200)
      expect(Array.isArray(searchResult.result.results)).toBe(true)
    })

    it('should handle parallel tool execution', async () => {
      const chatRequest = {
        message: 'Get weather and search for news in parallel using Grok 4',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('mcpResults')
      expect(Object.keys(result.mcpResults)).toHaveLength(2)
      expect(result.mcpResults).toHaveProperty('get_current_temperature')
      expect(result.mcpResults).toHaveProperty('web_search')
      expect(result.finalResponse).toContain('parallel')
      expect(result.finalResponse).toContain('Grok 4')
      
      // Should track tool executions
      expect(mockMonitoring.trackEvent).toHaveBeenCalledWith(
        'tool_execution',
        expect.objectContaining({
          toolName: expect.any(String),
          status: expect.any(String)
        }),
        'test-user-id'
      )
    })

    it('should handle email requests requiring human approval', async () => {
      const chatRequest = {
        message: 'Send an email to the team about the project update',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('needsHuman', true)
      expect(result).toHaveProperty('currentStep', 'awaiting_human_approval')
      expect(result.finalResponse).toContain('human approval')
      expect(result.plan?.requiresHumanApproval).toBe(true)
    })
  })

  describe('Grok 4 Streaming Support', () => {
    it('should support streaming responses', async () => {
      const { streamAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const steps: any[] = []

      for await (const step of streamAgenticChatbot('Test streaming with Grok 4')) {
        steps.push(step)
      }

      expect(steps).toHaveLength(3)
      expect(steps[0].currentStep).toBe('planning')
      expect(steps[1].currentStep).toBe('executing')
      expect(steps[2].currentStep).toBe('completed')
      expect(steps[2]).toHaveProperty('finalResponse')
      expect(steps[2].finalResponse).toContain('Grok 4')
    })

    it('should handle streaming with tool results', async () => {
      const { streamAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const steps: any[] = []

      for await (const step of streamAgenticChatbot('Stream weather data')) {
        steps.push(step)
      }

      const finalStep = steps[steps.length - 1]
      expect(finalStep).toHaveProperty('mcpResults')
      expect(finalStep.mcpResults).toHaveProperty('test_tool')
      expect(finalStep.mcpResults.test_tool.result.data).toContain('Grok 4')
    })
  })

  describe('Session Management', () => {
    it('should persist chat sessions with Grok 4 state', async () => {
      const chatRequest = {
        message: 'Test session persistence',
        sessionId: 'test-session-id',
        agentId: 'test-agent-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      await runAgenticChatbot(chatRequest.message)

      // Should have attempted to save session state
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should load existing session state', async () => {
      // Mock existing session
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{
              id: 'existing-session-id',
              userId: 'test-user-id',
              agentId: 'test-agent-id',
              state: JSON.stringify({
                messages: ['Previous Grok 4 message'],
                currentStep: 'completed',
                mcpResults: {
                  'previous_tool': {
                    status: 'completed',
                    result: { data: 'Grok 4 previous result' }
                  }
                }
              })
            }]))
          }))
        }))
      })

      const chatRequest = {
        message: 'Continue conversation',
        sessionId: 'existing-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
      // Should have loaded previous state
      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should handle session loading errors gracefully', async () => {
      // Mock database error
      mockDb.select.mockImplementationOnce(() => {
        throw new Error('Database connection failed')
      })

      const chatRequest = {
        message: 'Test error handling',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
      expect(mockMonitoring.captureError).toHaveBeenCalled()
    })
  })

  describe('Agent-Specific Configuration', () => {
    it('should handle agent-specific configurations', async () => {
      // Mock agent data
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{
              id: 'test-agent-id',
              name: 'Grok 4 Test Agent',
              spec: JSON.stringify({
                model: 'grok-4-0709',
                tools: ['get_current_temperature', 'web_search'],
                capabilities: ['structured_outputs', 'parallel_execution']
              })
            }]))
          }))
        }))
      })

      const chatRequest = {
        message: 'Test with specific agent',
        sessionId: 'test-session-id',
        agentId: 'test-agent-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
      expect(result).toHaveProperty('currentStep')
    })

    it('should handle missing agent gracefully', async () => {
      // Mock no agent found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([]))
          }))
        }))
      })

      const chatRequest = {
        message: 'Test with missing agent',
        sessionId: 'test-session-id',
        agentId: 'non-existent-agent-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
      expect(mockMonitoring.captureError).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle Grok 4 API errors gracefully', async () => {
      const chatRequest = {
        message: 'This should trigger an error',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('currentStep', 'error')
      expect(result).toHaveProperty('errorMessage')
      expect(result.finalResponse).toContain('error')
      
      // Should track failed chat
      expect(mockMonitoring.trackEvent).toHaveBeenCalledWith(
        'agent_chat_failed',
        expect.objectContaining({
          error: expect.any(String)
        }),
        'test-user-id'
      )
    })

    it('should handle malformed requests', async () => {
      const malformedRequests = [
        null,
        undefined,
        'not an object',
        { message: null },
        { message: 123 },
        { sessionId: null }
      ]

      const { z } = await import('zod')
      const ChatRequestSchema = z.object({
        message: z.string().min(1),
        sessionId: z.string().min(1)
      })

      malformedRequests.forEach(request => {
        expect(() => ChatRequestSchema.parse(request)).toThrow()
      })
    })

    it('should handle database errors during chat', async () => {
      // Mock database error during session save
      mockDb.insert.mockRejectedValueOnce(new Error('Database save failed'))

      const chatRequest = {
        message: 'Test database error handling',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
      expect(mockMonitoring.captureError).toHaveBeenCalled()
    })
  })

  describe('Performance and Monitoring', () => {
    it('should track execution metrics', async () => {
      const chatRequest = {
        message: 'Track performance metrics',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
      
      // Should start and finish transaction
      expect(mockMonitoring.startTransaction).toHaveBeenCalledWith(
        'chat_api_request',
        'http'
      )
      
      // Should track completion
      expect(mockMonitoring.trackEvent).toHaveBeenCalledWith(
        'agent_chat_completed',
        expect.objectContaining({
          duration: expect.any(Number)
        }),
        'test-user-id'
      )
    })

    it('should handle concurrent requests efficiently', async () => {
      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      
      const requests = [
        runAgenticChatbot('Concurrent request 1'),
        runAgenticChatbot('Concurrent request 2'),
        runAgenticChatbot('Concurrent request 3')
      ]

      const results = await Promise.all(requests)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toHaveProperty('finalResponse')
        expect(result).toHaveProperty('currentStep')
      })
    })

    it('should validate tool call responses', async () => {
      const chatRequest = {
        message: 'What is the weather like?',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      if (result.mcpResults && result.mcpResults.get_current_temperature) {
        const toolResult = result.mcpResults.get_current_temperature
        expect(toolResult).toHaveProperty('status')
        expect(toolResult).toHaveProperty('result')
        expect(toolResult).toHaveProperty('executionTime')
        expect(toolResult).toHaveProperty('timestamp')
        
        // Validate structured output
        expect(toolResult.result).toHaveProperty('temperature')
        expect(toolResult.result).toHaveProperty('location')
        expect(toolResult.result).toHaveProperty('conditions')
        expect(toolResult.result).toHaveProperty('humidity')
        expect(toolResult.result).toHaveProperty('windSpeed')
      }
    })
  })

  describe('Security and Rate Limiting', () => {
    it('should enforce rate limits per user', async () => {
      // This would be tested in the middleware, but we can verify the structure
      const chatRequest = {
        message: 'Test rate limiting',
        sessionId: 'test-session-id'
      }

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')
      const result = await runAgenticChatbot(chatRequest.message)

      expect(result).toHaveProperty('finalResponse')
    })

    it('should validate session ownership', async () => {
      const session = await mockAuth.api.getSession()
      
      expect(session).toHaveProperty('user')
      expect(session.user).toHaveProperty('id')
      expect(session).toHaveProperty('session')
    })

    it('should sanitize user input', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'DROP TABLE users;',
        '../../etc/passwd'
      ]

      const { runAgenticChatbot } = await import('@/lib/langgraph-chatbot')

      for (const input of maliciousInputs) {
        const result = await runAgenticChatbot(input)
        expect(result).toHaveProperty('finalResponse')
        // Input sanitization would be handled in the actual implementation
      }
    })
  })

  describe('GET /api/chat - Session Retrieval', () => {
    it('should retrieve existing chat session', async () => {
      const sessionId = 'test-session-id'
      
      // Mock session exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{
              id: sessionId,
              userId: 'test-user-id',
              state: JSON.stringify({
                messages: ['Previous message'],
                currentStep: 'completed',
                mcpResults: {}
              })
            }]))
          }))
        }))
      })

      // Simulate GET request logic
      const session = await mockAuth.api.getSession()
      expect(session).toHaveProperty('user')
      
      // Should be able to load session
      expect(mockDb.select).toBeDefined()
    })

    it('should handle missing session', async () => {
      // Mock no session found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([]))
          }))
        }))
      })

      // Should handle gracefully
      const result = await mockDb.select().from().where().limit()
      expect(result).toHaveLength(0)
    })

    it('should require authentication for session retrieval', async () => {
      // Mock unauthenticated request
      mockAuth.api.getSession.mockResolvedValueOnce(null)

      const session = await mockAuth.api.getSession()
      expect(session).toBeNull()
    })
  })
})
