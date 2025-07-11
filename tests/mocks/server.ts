import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock handlers for external APIs
export const handlers = [
  // xAI Grok 4 API mock with structured outputs
  http.post('https://api.x.ai/v1/chat/completions', async ({ request }) => {
    const body = await request.json() as any
    
    // Simulate different Grok 4 responses based on request
    const messages = body.messages || []
    const lastMessage = messages[messages.length - 1]?.content || ''
    const model = body.model || 'grok-4-0709'
    
    // Mock Grok 4 parameter validation - reject deprecated parameters
    if (body.presence_penalty !== undefined || body.frequency_penalty !== undefined) {
      return HttpResponse.json({
        error: {
          message: 'Invalid parameter: presence_penalty and frequency_penalty are not supported in Grok 4',
          type: 'invalid_request_error',
          code: 'invalid_parameter'
        }
      }, { status: 400 })
    }
    
    // Mock tool calls for specific requests
    if (lastMessage.includes('weather') || lastMessage.includes('temperature')) {
      return HttpResponse.json({
        id: 'chatcmpl-grok4-weather',
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call_grok4_weather_001',
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
          },
          finish_reason: 'tool_calls'
        }],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 35,
          total_tokens: 155
        }
      })
    }
    
    if (lastMessage.includes('search') || lastMessage.includes('web')) {
      return HttpResponse.json({
        id: 'chatcmpl-grok4-search',
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call_grok4_search_001',
              type: 'function',
              function: {
                name: 'web_search',
                arguments: JSON.stringify({
                  query: 'AI developments 2024',
                  num_results: 5,
                  includeSnippets: true
                })
              }
            }]
          },
          finish_reason: 'tool_calls'
        }],
        usage: {
          prompt_tokens: 95,
          completion_tokens: 42,
          total_tokens: 137
        }
      })
    }
    
    // Mock parallel tool execution for Grok 4
    if (lastMessage.includes('parallel') || lastMessage.includes('multiple')) {
      return HttpResponse.json({
        id: 'chatcmpl-grok4-parallel',
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_grok4_weather_parallel',
                type: 'function',
                function: {
                  name: 'get_current_temperature',
                  arguments: JSON.stringify({
                    location: 'New York, NY',
                    unit: 'fahrenheit'
                  })
                }
              },
              {
                id: 'call_grok4_search_parallel',
                type: 'function',
                function: {
                  name: 'web_search',
                  arguments: JSON.stringify({
                    query: 'latest tech news',
                    num_results: 3
                  })
                }
              }
            ]
          },
          finish_reason: 'tool_calls'
        }],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 85,
          total_tokens: 235
        }
      })
    }
    
    // Mock email tool call (requires human approval)
    if (lastMessage.includes('email') || lastMessage.includes('send')) {
      return HttpResponse.json({
        id: 'chatcmpl-grok4-email',
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'I can help you send an email, but this requires human approval for security.',
            tool_calls: [{
              id: 'call_grok4_email_001',
              type: 'function',
              function: {
                name: 'send_email',
                arguments: JSON.stringify({
                  to: 'team@example.com',
                  subject: 'Project Update',
                  body: 'Here is the latest project update...',
                  priority: 'normal'
                })
              }
            }]
          },
          finish_reason: 'tool_calls'
        }],
        usage: {
          prompt_tokens: 80,
          completion_tokens: 45,
          total_tokens: 125
        }
      })
    }
    
    // Default Grok 4 response with enhanced reasoning
    return HttpResponse.json({
      id: 'chatcmpl-grok4-default',
      object: 'chat.completion',
      created: Date.now(),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a Grok 4 response with enhanced reasoning capabilities and 256K context window support.',
          tool_calls: null
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 25,
        total_tokens: 75
      }
    })
  }),
  
  // OpenAI API mock (fallback)
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      id: 'chatcmpl-openai-fallback',
      object: 'chat.completion',
      created: Date.now(),
      model: body.model || 'gpt-4o-mini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a fallback OpenAI response for testing.',
          tool_calls: null
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 30,
        completion_tokens: 15,
        total_tokens: 45
      }
    })
  }),
  
  // Mock weather API for tool testing
  http.get('https://api.weather.com/*', () => {
    return HttpResponse.json({
      location: 'San Francisco, CA',
      temperature: 72,
      unit: 'fahrenheit',
      conditions: 'sunny',
      humidity: 65,
      windSpeed: 8,
      timestamp: new Date().toISOString()
    })
  }),
  
  // Mock search API for tool testing
  http.get('https://api.search.com/*', () => {
    return HttpResponse.json({
      results: [
        {
          title: 'AI Development News 2024',
          url: 'https://example.com/ai-news-2024',
          snippet: 'Latest developments in AI technology including Grok 4 release...',
          relevanceScore: 0.95
        },
        {
          title: 'Machine Learning Advances',
          url: 'https://example.com/ml-advances',
          snippet: 'Recent advances in machine learning and structured outputs...',
          relevanceScore: 0.87
        }
      ],
      totalResults: 2,
      searchTime: 150
    })
  }),
  
  // Mock email service
  http.post('https://api.email.com/send', () => {
    return HttpResponse.json({
      messageId: 'msg_grok4_test_12345',
      status: 'sent',
      recipient: 'test@example.com',
      timestamp: new Date().toISOString(),
      deliveryTime: 250
    })
  }),
  
  // Mock Sentry API
  http.post('https://sentry.io/api/*/store/', () => {
    return HttpResponse.json({ id: 'test-sentry-event-id' })
  }),
  
  // Mock PostHog API
  http.post('https://us.i.posthog.com/capture/', () => {
    return HttpResponse.json({ status: 1 })
  }),
  
  http.post('https://us.i.posthog.com/batch/', () => {
    return HttpResponse.json({ status: 1 })
  }),
  
  // Mock Redis/Upstash
  http.post('https://redis.upstash.io/*', () => {
    return HttpResponse.json({ result: 'OK' })
  }),
  
  http.get('https://redis.upstash.io/*', () => {
    return HttpResponse.json({ result: null })
  }),
  
  // Mock database operations for file operations tool
  http.post('https://api.database.com/query', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      rows: [
        { id: 1, name: 'Test Data', value: 42 },
        { id: 2, name: 'More Test Data', value: 84 }
      ],
      query: body.sql || 'SELECT * FROM test_table',
      rowCount: 2,
      executionTime: 45
    })
  }),
  
  // Mock file operations
  http.get('https://api.files.com/read/*', () => {
    return HttpResponse.json({
      success: true,
      operation: 'read',
      filename: 'test.txt',
      content: 'This is test file content',
      size: 1024
    })
  }),
  
  http.post('https://api.files.com/write/*', () => {
    return HttpResponse.json({
      success: true,
      operation: 'write',
      filename: 'test.txt',
      size: 2048
    })
  }),
  
  // Mock rate limiting scenarios
  http.post('https://api.ratelimit.com/check', ({ request }) => {
    const url = new URL(request.url)
    const identifier = url.searchParams.get('identifier')
    
    // Simulate rate limit exceeded for specific test cases
    if (identifier === 'rate-limited-user') {
      return HttpResponse.json({
        success: false,
        limit: 30,
        remaining: 0,
        reset: Date.now() + 60000
      }, { status: 429 })
    }
    
    return HttpResponse.json({
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 60000
    })
  })
]

export const server = setupServer(...handlers)
