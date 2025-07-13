import '@testing-library/jest-dom'
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { server } from './mocks/server'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only-32-chars'
process.env.XAI_API_KEY = 'test-xai-key-for-testing'
process.env.OPENAI_API_KEY = 'test-openai-key-for-testing'
process.env.LLM_PROVIDER = 'xai'
process.env.XAI_MODEL_ID = 'grok-4-0709'
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:6379'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.SENTRY_DSN = 'https://test@sentry.io/test'
process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/test'
process.env.POSTHOG_KEY = 'test-posthog-key'
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-posthog-key'

// Mock Next.js modules
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers({
    'user-agent': 'test-user-agent',
    'x-forwarded-for': '127.0.0.1'
  }))),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }))
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn()
}))

// Mock Redis/Upstash
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve('OK')),
    del: vi.fn(() => Promise.resolve(1)),
    incr: vi.fn(() => Promise.resolve(1)),
    expire: vi.fn(() => Promise.resolve(1)),
    exists: vi.fn(() => Promise.resolve(0)),
    hget: vi.fn(() => Promise.resolve(null)),
    hset: vi.fn(() => Promise.resolve(1)),
    hdel: vi.fn(() => Promise.resolve(1))
  }))
}))

// Mock rate limiting
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn(() => ({
    limit: vi.fn(() => Promise.resolve({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000
    })),
    slidingWindow: vi.fn()
  }))
}))

// Mock Drizzle ORM with comprehensive database operations
const mockDbOperations = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve([])),
        offset: vi.fn(() => Promise.resolve([])),
        orderBy: vi.fn(() => Promise.resolve([])),
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
            orderBy: vi.fn(() => Promise.resolve([]))
          }))
        }))
      })),
      leftJoin: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => Promise.resolve([]))
        }))
      })),
      limit: vi.fn(() => Promise.resolve([])),
      orderBy: vi.fn(() => Promise.resolve([]))
    }))
  })),
  insert: vi.fn(() => ({
    into: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'test-id',
          createdAt: new Date(),
          updatedAt: new Date()
        }])),
        onConflictDoUpdate: vi.fn(() => Promise.resolve([]))
      }))
    }))
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([{
        id: 'test-id',
        updatedAt: new Date()
      }]))
    }))
  })),
  delete: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([]))
    }))
  }))
}

vi.mock('@/db/drizzle', () => ({
  db: mockDbOperations
}))

// Mock auth with comprehensive user scenarios
const mockAuth = {
  api: {
    getSession: vi.fn(() => Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      session: {
        id: 'test-session-id',
        userId: 'test-user-id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }))
  }
}

vi.mock('@/lib/auth', () => ({
  auth: mockAuth
}))

// Mock LangChain/OpenAI with Grok 4 specific responses
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(() => ({
    invoke: vi.fn((messages) => {
      const lastMessage = Array.isArray(messages) ? messages[messages.length - 1]?.content : messages
      
      // Mock Grok 4 structured responses based on message content
      if (typeof lastMessage === 'string') {
        if (lastMessage.includes('weather') || lastMessage.includes('temperature')) {
          return Promise.resolve({
            content: null,
            tool_calls: [{
              id: 'call_grok4_weather',
              type: 'function',
              function: {
                name: 'get_current_temperature',
                arguments: JSON.stringify({
                  location: 'San Francisco, CA',
                  unit: 'fahrenheit',
                  includeExtended: true
                })
              }
            }]
          })
        }
        
        if (lastMessage.includes('search') || lastMessage.includes('web')) {
          return Promise.resolve({
            content: null,
            tool_calls: [{
              id: 'call_grok4_search',
              type: 'function',
              function: {
                name: 'web_search',
                arguments: JSON.stringify({
                  query: 'AI developments',
                  num_results: 5,
                  includeSnippets: true
                })
              }
            }]
          })
        }
        
        if (lastMessage.includes('parallel') || lastMessage.includes('multiple')) {
          return Promise.resolve({
            content: null,
            tool_calls: [
              {
                id: 'call_grok4_weather_parallel',
                type: 'function',
                function: {
                  name: 'get_current_temperature',
                  arguments: JSON.stringify({ location: 'New York, NY', unit: 'fahrenheit' })
                }
              },
              {
                id: 'call_grok4_search_parallel',
                type: 'function',
                function: {
                  name: 'web_search',
                  arguments: JSON.stringify({ query: 'news today', num_results: 3 })
                }
              }
            ]
          })
        }
      }
      
      // Default Grok 4 response
      return Promise.resolve({
        content: 'This is a mocked Grok 4 response with enhanced reasoning capabilities.',
        tool_calls: []
      })
    }),
    bindTools: vi.fn(function() { return this }),
    stream: vi.fn(() => ({
      [Symbol.asyncIterator]: async function* () {
        yield { content: 'Mocked Grok 4 streaming response chunk 1' }
        yield { content: 'Mocked Grok 4 streaming response chunk 2' }
        yield { content: 'Final Grok 4 streaming response' }
      }
    }))
  }))
}))

// Mock LangGraph with Grok 4 enhanced capabilities
vi.mock('@langchain/langgraph', () => ({
  StateGraph: vi.fn(() => ({
    addNode: vi.fn(function() { return this }),
    addEdge: vi.fn(function() { return this }),
    addConditionalEdges: vi.fn(function() { return this }),
    compile: vi.fn(() => ({
      invoke: vi.fn((state) => Promise.resolve({
        messages: state?.messages || ['test message'],
        finalResponse: 'Mocked Grok 4 LangGraph response with structured outputs',
        currentStep: 'completed',
        mcpResults: {
          'get_current_temperature': {
            status: 'completed',
            result: {
              location: 'San Francisco, CA',
              temperature: 72,
              unit: 'fahrenheit',
              conditions: 'sunny',
              timestamp: new Date().toISOString(),
              humidity: 65,
              windSpeed: 8
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
            description: 'Get weather information',
            params: { location: 'San Francisco, CA' },
            priority: 'medium',
            requiresHuman: false
          }],
          reasoning: 'Grok 4 enhanced reasoning for weather request',
          estimatedComplexity: 'simple',
          requiresHumanApproval: false
        }
      })),
      stream: vi.fn(async function* (state) {
        yield {
          messages: state?.messages || ['test message'],
          currentStep: 'planning',
          plan: null,
          mcpResults: {}
        }
        yield {
          messages: state?.messages || ['test message'],
          currentStep: 'executing',
          plan: { tasks: [], reasoning: 'Grok 4 processing' },
          mcpResults: {}
        }
        yield {
          messages: state?.messages || ['test message'],
          currentStep: 'completed',
          finalResponse: 'Grok 4 streaming response completed',
          mcpResults: {
            'test_tool': {
              status: 'completed',
              result: { data: 'Grok 4 structured output' }
            }
          }
        }
      })
    }))
  })),
  Annotation: {
    Root: vi.fn(() => ({}))
  },
  START: 'START',
  END: 'END'
}))

// Mock Sentry with error capture
vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
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
}))

// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    __loaded: true
  }
}))

vi.mock('posthog-node', () => ({
  PostHog: vi.fn(() => ({
    capture: vi.fn(),
    identify: vi.fn(),
    shutdown: vi.fn()
  }))
}))

// Setup MSW server
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  
  // Set consistent date for all tests to avoid timestamp mismatches
  vi.setSystemTime(new Date('2025-07-13T04:07:12.000Z'))
  
  // Setup global mocks using vi.stubGlobal for proper cleanup
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          offset: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => Promise.resolve([])),
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
              orderBy: vi.fn(() => Promise.resolve([]))
            }))
          }))
        })),
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
            orderBy: vi.fn(() => Promise.resolve([]))
          }))
        })),
        limit: vi.fn(() => Promise.resolve([])),
        orderBy: vi.fn(() => Promise.resolve([]))
      }))
    })),
    insert: vi.fn(() => ({
      into: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{
            id: 'test-id',
            createdAt: new Date(),
            updatedAt: new Date()
          }])),
          onConflictDoUpdate: vi.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{
          id: 'test-id',
          updatedAt: new Date()
        }]))
      }))
    })),
    delete: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([]))
      }))
    }))
  }

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

  const mockPostHog = {
    capture: vi.fn(),
    identify: vi.fn(),
    people: {
      set: vi.fn()
    },
    isFeatureEnabled: vi.fn(() => false),
    __loaded: true
  }

  const mockPostHogServer = {
    capture: vi.fn(),
    identify: vi.fn(),
    shutdown: vi.fn()
  }

  // Stub global variables
  vi.stubGlobal('mockDb', mockDb)
  vi.stubGlobal('mockSentry', mockSentry)
  vi.stubGlobal('mockPostHog', mockPostHog)
  vi.stubGlobal('mockPostHogServer', mockPostHogServer)
  vi.stubGlobal('getUserUsageThisMonth', vi.fn(() => Promise.resolve({
    apiCalls: 5000,
    agentDownloads: 25,
    agentShares: 10
  })))
  vi.stubGlobal('getUserSubscription', vi.fn(() => Promise.resolve({
    planType: 'pro',
    status: 'active'
  })))
})

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  
  // Reset global mock states
  if (global.mockDb) {
    Object.values(global.mockDb).forEach(mockFn => {
      if (typeof mockFn === 'function' && mockFn.mockClear) {
        mockFn.mockClear()
      }
    })
  }
  
  if (global.mockSentry) {
    Object.values(global.mockSentry).forEach(mockFn => {
      if (typeof mockFn === 'function' && mockFn.mockClear) {
        mockFn.mockClear()
      }
    })
  }
  
  if (global.mockPostHog) {
    if (global.mockPostHog.capture && global.mockPostHog.capture.mockClear) {
      global.mockPostHog.capture.mockClear()
    }
    if (global.mockPostHog.identify && global.mockPostHog.identify.mockClear) {
      global.mockPostHog.identify.mockClear()
    }
  }
  
  if (global.mockPostHogServer) {
    Object.values(global.mockPostHogServer).forEach(mockFn => {
      if (typeof mockFn === 'function' && mockFn.mockClear) {
        mockFn.mockClear()
      }
    })
  }
})

afterAll(() => {
  server.close()
  vi.useRealTimers()
})

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createMockAdminUser: (overrides = {}) => ({
    id: 'test-admin-id',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createMockSession: (overrides = {}) => ({
    id: 'test-session-id',
    userId: 'test-user-id',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides
  }),
  
  createMockAgent: (overrides = {}) => ({
    id: 'test-agent-id',
    name: 'Test Agent',
    description: 'A test agent for Grok 4',
    userId: 'test-user-id',
    spec: JSON.stringify({ 
      tools: ['get_current_temperature', 'web_search'],
      model: 'grok-4-0709',
      capabilities: ['structured_outputs', 'parallel_execution']
    }),
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createMockChatSession: (overrides = {}) => ({
    id: 'test-chat-session-id',
    userId: 'test-user-id',
    agentId: 'test-agent-id',
    state: JSON.stringify({
      messages: [],
      currentStep: 'start',
      mcpResults: {},
      model: 'grok-4-0709'
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  createMockSecurityEvent: (overrides = {}) => ({
    id: 'test-security-event-id',
    eventType: 'security_login_attempt',
    severity: 'medium',
    details: JSON.stringify({
      userAgent: 'test-user-agent',
      hashedIp: 'hashed-ip-123',
      timestamp: new Date().toISOString()
    }),
    userId: 'test-user-id',
    createdAt: new Date(),
    ...overrides
  }),
  
  // Mock Grok 4 structured response
  createMockGrok4Response: (toolCalls = []) => ({
    content: toolCalls.length > 0 ? null : 'Grok 4 enhanced response',
    tool_calls: toolCalls,
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150
    }
  }),
  
  // Mock tool call for Grok 4
  createMockToolCall: (name: string, args: Record<string, any>) => ({
    id: `call_grok4_${name}_${Date.now()}`,
    type: 'function',
    function: {
      name,
      arguments: JSON.stringify(args)
    }
  }),
  
  // Set admin user for tests
  setAdminUser: () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: {
        id: 'test-admin-id',
        email: 'admin@example.com',
        name: 'Test Admin',
        role: 'admin'
      },
      session: {
        id: 'test-admin-session-id',
        userId: 'test-admin-id'
      }
    })
  },
  
  // Set regular user for tests
  setRegularUser: () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      session: {
        id: 'test-session-id',
        userId: 'test-user-id'
      }
    })
  },
  
  // Set unauthenticated state
  setUnauthenticated: () => {
    mockAuth.api.getSession.mockResolvedValue(null)
  }
}

// Extend global types
declare global {
  var testUtils: {
    createMockUser: (overrides?: any) => any
    createMockAdminUser: (overrides?: any) => any
    createMockSession: (overrides?: any) => any
    createMockAgent: (overrides?: any) => any
    createMockChatSession: (overrides?: any) => any
    createMockSecurityEvent: (overrides?: any) => any
    createMockGrok4Response: (toolCalls?: any[]) => any
    createMockToolCall: (name: string, args: Record<string, any>) => any
    setAdminUser: () => void
    setRegularUser: () => void
    setUnauthenticated: () => void
  }
}
