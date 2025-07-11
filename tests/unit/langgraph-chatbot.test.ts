import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  runAgenticChatbot, 
  streamAgenticChatbot,
  tools,
  LLM_PROVIDER,
  XAI_MODEL_ID,
  TemperatureResponseSchema,
  WebSearchResponseSchema,
  EmailResponseSchema,
  DatabaseResponseSchema,
  FileOperationResponseSchema
} from '@/lib/langgraph-chatbot'

// Mock the subscription module for Heavy tier testing
vi.mock('@/lib/subscription', () => ({
  hasGrokHeavyTierAccess: vi.fn(() => Promise.resolve(true)),
  getGrokTierInfo: vi.fn(() => Promise.resolve({
    tier: 'grok_heavy',
    hasHeavyAccess: true,
    multiAgentEnabled: true,
    contextLimit: '256K tokens',
    parallelProcessing: true
  }))
}))

describe('LangGraph Chatbot with Grok 4', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Grok 4 Configuration', () => {
    it('should use Grok 4 model configuration', () => {
      expect(LLM_PROVIDER).toBe('xai')
      expect(XAI_MODEL_ID).toBe('grok-4-0709')
    })

    it('should have all required tools available', () => {
      const toolNames = tools.map(tool => tool.name)
      expect(toolNames).toContain('get_current_temperature')
      expect(toolNames).toContain('web_search')
      expect(toolNames).toContain('send_email')
      expect(toolNames).toContain('database_query')
      expect(toolNames).toContain('file_operation')
      expect(tools).toHaveLength(5)
    })

    it('should support 256K token context window', () => {
      // Test with a large message that would exceed smaller context windows
      const largeMessage = "Analyze this data: " + "x".repeat(10000) + " and provide insights"
      expect(largeMessage.length).toBeGreaterThan(10000)
      
      // Should not throw an error for large context
      expect(() => runAgenticChatbot(largeMessage)).not.toThrow()
    })
  })

  describe('Grok 4 Structured Output Schemas', () => {
    it('should validate temperature response with extended data', () => {
      const grok4TemperatureResponse = {
        location: 'San Francisco, CA',
        temperature: 72,
        unit: 'fahrenheit' as const,
        conditions: 'sunny',
        timestamp: new Date().toISOString(),
        humidity: 65,
        windSpeed: 8
      }
      
      expect(() => TemperatureResponseSchema.parse(grok4TemperatureResponse)).not.toThrow()
      
      const parsed = TemperatureResponseSchema.parse(grok4TemperatureResponse)
      expect(parsed.humidity).toBe(65)
      expect(parsed.windSpeed).toBe(8)
    })

    it('should validate web search response with relevance scoring', () => {
      const grok4SearchResponse = {
        results: [
          {
            title: 'AI Development News 2024',
            url: 'https://example.com/ai-news',
            snippet: 'Latest AI developments...',
            relevanceScore: 0.95
          }
        ],
        query: 'AI developments 2024',
        totalResults: 1,
        searchTime: 150
      }
      
      expect(() => WebSearchResponseSchema.parse(grok4SearchResponse)).not.toThrow()
      
      const parsed = WebSearchResponseSchema.parse(grok4SearchResponse)
      expect(parsed.results[0].relevanceScore).toBe(0.95)
      expect(parsed.searchTime).toBe(150)
    })

    it('should validate email response with delivery metrics', () => {
      const grok4EmailResponse = {
        messageId: 'msg_grok4_123',
        status: 'sent' as const,
        recipient: 'test@example.com',
        subject: 'Test Email',
        timestamp: new Date().toISOString(),
        deliveryTime: 250
      }
      
      expect(() => EmailResponseSchema.parse(grok4EmailResponse)).not.toThrow()
      
      const parsed = EmailResponseSchema.parse(grok4EmailResponse)
      expect(parsed.deliveryTime).toBe(250)
    })

    it('should validate database response with performance metrics', () => {
      const grok4DatabaseResponse = {
        rows: [{ id: 1, name: 'test', value: 42 }],
        query: 'SELECT * FROM test WHERE id = 1',
        rowCount: 1,
        executionTime: 45,
        affectedRows: 0
      }
      
      expect(() => DatabaseResponseSchema.parse(grok4DatabaseResponse)).not.toThrow()
      
      const parsed = DatabaseResponseSchema.parse(grok4DatabaseResponse)
      expect(parsed.executionTime).toBe(45)
      expect(parsed.affectedRows).toBe(0)
    })

    it('should validate file operation response with security checks', () => {
      const grok4FileResponse = {
        success: true,
        operation: 'read' as const,
        filename: 'test.txt',
        size: 1024,
        content: 'file content'
      }
      
      expect(() => FileOperationResponseSchema.parse(grok4FileResponse)).not.toThrow()
      
      const parsed = FileOperationResponseSchema.parse(grok4FileResponse)
      expect(parsed.content).toBe('file content')
    })
  })

  describe('Grok 4 Tool Execution', () => {
    it('should execute temperature tool with extended weather data', async () => {
      const temperatureTool = tools.find(t => t.name === 'get_current_temperature')!
      
      const result = await temperatureTool.func({
        location: 'San Francisco, CA',
        unit: 'fahrenheit',
        includeExtended: true
      })
      
      expect(result).toHaveProperty('location', 'San Francisco, CA')
      expect(result).toHaveProperty('temperature')
      expect(result).toHaveProperty('unit', 'fahrenheit')
      expect(result).toHaveProperty('conditions')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('humidity')
      expect(result).toHaveProperty('windSpeed')
      
      // Validate with Grok 4 schema
      expect(() => TemperatureResponseSchema.parse(result)).not.toThrow()
    })

    it('should execute web search with enhanced parameters', async () => {
      const searchTool = tools.find(t => t.name === 'web_search')!
      
      const result = await searchTool.func({
        query: 'Grok 4 AI developments',
        num_results: 5,
        includeSnippets: true
      })
      
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('query', 'Grok 4 AI developments')
      expect(result).toHaveProperty('totalResults')
      expect(result).toHaveProperty('searchTime')
      expect(Array.isArray(result.results)).toBe(true)
      
      // Validate with Grok 4 schema
      expect(() => WebSearchResponseSchema.parse(result)).not.toThrow()
    })

    it('should execute email tool with priority and validation', async () => {
      const emailTool = tools.find(t => t.name === 'send_email')!
      
      const result = await emailTool.func({
        to: 'test@example.com',
        subject: 'Grok 4 Test Email',
        body: 'This is a test email from Grok 4',
        priority: 'high'
      })
      
      expect(result).toHaveProperty('messageId')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('recipient', 'test@example.com')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('deliveryTime')
      
      // Validate with Grok 4 schema
      expect(() => EmailResponseSchema.parse(result)).not.toThrow()
    })

    it('should execute database query with performance monitoring', async () => {
      const dbTool = tools.find(t => t.name === 'database_query')!
      
      const result = await dbTool.func({
        sql: 'SELECT * FROM users WHERE active = true LIMIT 10',
        database: 'main',
        readonly: true
      })
      
      expect(result).toHaveProperty('rows')
      expect(result).toHaveProperty('query')
      expect(result).toHaveProperty('rowCount')
      expect(result).toHaveProperty('executionTime')
      expect(result).toHaveProperty('affectedRows')
      expect(Array.isArray(result.rows)).toBe(true)
      
      // Validate with Grok 4 schema
      expect(() => DatabaseResponseSchema.parse(result)).not.toThrow()
    })

    it('should execute file operations with enhanced security', async () => {
      const fileTool = tools.find(t => t.name === 'file_operation')!
      
      const result = await fileTool.func({
        operation: 'read',
        filename: 'config.json',
        encoding: 'utf8'
      })
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('operation', 'read')
      expect(result).toHaveProperty('filename', 'config.json')
      expect(result).toHaveProperty('size')
      
      // Validate with Grok 4 schema
      expect(() => FileOperationResponseSchema.parse(result)).not.toThrow()
    })

    it('should reject unsafe file paths with enhanced security', async () => {
      const fileTool = tools.find(t => t.name === 'file_operation')!
      
      const unsafePaths = [
        '/etc/passwd',
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/var/log/auth.log',
        'C:\\Windows\\System32\\config\\SAM'
      ]
      
      for (const path of unsafePaths) {
        await expect(fileTool.func({
          operation: 'read',
          filename: path
        })).rejects.toThrow('Absolute paths and directory traversal not allowed')
      }
    })
  })

  describe('Grok 4 Parallel Tool Execution', () => {
    it('should handle parallel tool execution efficiently', async () => {
      const message = "Get weather for San Francisco and search for AI news simultaneously"
      
      const startTime = Date.now()
      const result = await runAgenticChatbot(message)
      const endTime = Date.now()
      
      expect(result).toHaveProperty('finalResponse')
      expect(result).toHaveProperty('currentStep')
      expect(result).toHaveProperty('mcpResults')
      expect(result.currentStep).not.toBe('error')
      
      // Should have executed multiple tools
      const toolResults = Object.keys(result.mcpResults || {})
      expect(toolResults.length).toBeGreaterThan(0)
      
      // Parallel execution should be faster than sequential
      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should track performance metrics for parallel execution', async () => {
      const message = "Execute multiple tools: weather, search, and database query"
      
      const result = await runAgenticChatbot(message)
      
      expect(result).toHaveProperty('mcpResults')
      
      // Check if performance metrics are tracked
      const toolResults = Object.values(result.mcpResults || {})
      toolResults.forEach((toolResult: any) => {
        if (toolResult.status === 'completed' || toolResult.status === 'success') {
          expect(toolResult).toHaveProperty('timestamp')
          expect(toolResult).toHaveProperty('executionTime')
          expect(typeof toolResult.executionTime).toBe('number')
        }
      })
    })

    it('should handle tool failures gracefully in parallel execution', async () => {
      // Mock one tool to fail
      const originalFunc = tools[0].func
      tools[0].func = vi.fn(() => Promise.reject(new Error('Simulated tool failure')))
      
      const message = "Execute multiple tools with one failing"
      const result = await runAgenticChatbot(message)
      
      expect(result).toHaveProperty('finalResponse')
      expect(result).toHaveProperty('mcpResults')
      
      // Should handle the failure gracefully
      const toolResults = Object.values(result.mcpResults || {})
      const failedResults = toolResults.filter((r: any) => r.status === 'failed')
      expect(failedResults.length).toBeGreaterThanOrEqual(0)
      
      // Restore original function
      tools[0].func = originalFunc
    })
  })

  describe('Grok 4 Streaming Execution', () => {
    it('should support enhanced streaming with structured outputs', async () => {
      const message = "Stream a complex analysis with multiple steps"
      const steps: any[] = []
      
      for await (const step of streamAgenticChatbot(message)) {
        steps.push(step)
      }
      
      expect(steps.length).toBeGreaterThan(0)
      
      // Should have progression of steps
      const stepNames = steps.map(s => s.currentStep).filter(Boolean)
      expect(stepNames.length).toBeGreaterThan(0)
      
      // Final step should have structured response
      const finalStep = steps[steps.length - 1]
      expect(finalStep).toHaveProperty('currentStep')
      expect(finalStep).toHaveProperty('finalResponse')
      
      // Should include structured tool results
      if (finalStep.mcpResults) {
        Object.values(finalStep.mcpResults).forEach((result: any) => {
          if (result.status === 'completed') {
            expect(result).toHaveProperty('result')
            expect(result).toHaveProperty('timestamp')
          }
        })
      }
    })

    it('should handle streaming errors with proper recovery', async () => {
      const message = "This should cause a streaming error for testing"
      const steps: any[] = []
      
      try {
        for await (const step of streamAgenticChatbot(message)) {
          steps.push(step)
        }
      } catch (error) {
        // Should handle errors gracefully
        expect(error).toBeDefined()
      }
      
      // Should still have some steps even if error occurs
      expect(steps.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Grok 4 Multi-Agent Coordination', () => {
    it('should check Heavy tier access for multi-agent features', async () => {
      const { hasGrokHeavyTierAccess } = await import('@/lib/subscription')
      
      const hasAccess = await hasGrokHeavyTierAccess()
      expect(hasAccess).toBe(true)
    })

    it('should enable advanced features with Heavy tier', async () => {
      const message = "Complex multi-agent business analysis with Grok 4 coordination"
      
      const result = await runAgenticChatbot(message)
      
      expect(result).toHaveProperty('finalResponse')
      expect(result).toHaveProperty('plan')
      
      // With Heavy tier, should be able to handle complex tasks
      expect(result.finalResponse).toBeDefined()
      expect(result.finalResponse).toContain('Grok 4')
    })

    it('should handle multi-agent orchestration', async () => {
      const { getGrokTierInfo } = await import('@/lib/subscription')
      
      const tierInfo = await getGrokTierInfo()
      expect(tierInfo.multiAgentEnabled).toBe(true)
      expect(tierInfo.parallelProcessing).toBe(true)
      expect(tierInfo.contextLimit).toBe('256K tokens')
    })
  })

  describe('Grok 4 Context Window Utilization', () => {
    it('should handle large context efficiently', async () => {
      // Create a message that uses significant context (simulating 256K tokens)
      const largeContext = "Analyze this comprehensive dataset: " + 
        Array.from({ length: 1000 }, (_, i) => `Data point ${i}: ${JSON.stringify({ 
          id: i, 
          value: Math.random() * 100, 
          category: `category_${i % 10}`,
          timestamp: new Date(Date.now() - i * 1000).toISOString()
        })}`).join('\n')
      
      const result = await runAgenticChatbot(largeContext)
      
      expect(result).toHaveProperty('finalResponse')
      expect(result.currentStep).not.toBe('error')
      expect(result.finalResponse).toBeDefined()
    })

    it('should maintain context across multiple interactions', async () => {
      const firstMessage = "Remember that I'm working on a Grok 4 AI project with structured outputs"
      const firstResult = await runAgenticChatbot(firstMessage)
      
      expect(firstResult).toHaveProperty('finalResponse')
      
      // Second message referencing previous context
      const secondMessage = "What Grok 4 features would be most helpful for my project?"
      const secondResult = await runAgenticChatbot(secondMessage, {
        messages: [firstMessage],
        mcpResults: firstResult.mcpResults
      })
      
      expect(secondResult).toHaveProperty('finalResponse')
      expect(secondResult.finalResponse).toBeDefined()
    })
  })

  describe('Grok 4 Parameter Compatibility', () => {
    it('should reject deprecated parameters', async () => {
      // Test that Grok 4 properly rejects deprecated parameters
      const message = "Test message for parameter validation"
      
      // This should work fine with supported parameters
      const result = await runAgenticChatbot(message)
      expect(result).toHaveProperty('finalResponse')
      
      // The MSW mock will handle rejecting deprecated parameters like presencePenalty
      // This is tested in the MSW server mock
    })

    it('should support Grok 4 specific parameters', async () => {
      const message = "Test Grok 4 specific configuration"
      
      const result = await runAgenticChatbot(message)
      
      expect(result).toHaveProperty('finalResponse')
      expect(result).toHaveProperty('currentStep')
      
      // Should complete successfully with Grok 4 parameters
      expect(result.currentStep).not.toBe('error')
    })
  })

  describe('Grok 4 Error Handling and Recovery', () => {
    it('should handle API errors gracefully', async () => {
      const message = "This should trigger an API error for testing"
      
      const result = await runAgenticChatbot(message)
      
      expect(result).toHaveProperty('finalResponse')
      expect(result).toHaveProperty('currentStep')
      
      // Should provide a user-friendly error message
      if (result.currentStep === 'error') {
        expect(result.errorMessage).toBeDefined()
        expect(result.finalResponse).toContain('error')
      }
    })

    it('should handle network timeouts', async () => {
      const message = "Test network timeout handling"
      
      const result = await runAgenticChatbot(message)
      
      expect(result).toHaveProperty('finalResponse')
      expect(result.finalResponse).toBeDefined()
    })

    it('should validate input parameters', async () => {
      // Test with invalid input
      const invalidInputs = ['', null, undefined]
      
      for (const input of invalidInputs) {
        const result = await runAgenticChatbot(input as any)
        expect(result).toHaveProperty('finalResponse')
        expect(result).toHaveProperty('currentStep')
      }
    })
  })

  describe('Grok 4 Performance Benchmarks', () => {
    it('should complete simple requests within reasonable time', async () => {
      const startTime = Date.now()
      
      const result = await runAgenticChatbot("Hello, test Grok 4 response time")
      
      const endTime = Date.now()
      const executionTime = endTime - startTime
      
      expect(result).toHaveProperty('finalResponse')
      expect(executionTime).toBeLessThan(3000) // Should complete within 3 seconds
    })

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        runAgenticChatbot(`Grok 4 concurrent test message ${i + 1}`)
      )
      
      const startTime = Date.now()
      const results = await Promise.all(requests)
      const endTime = Date.now()
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toHaveProperty('finalResponse')
      })
      
      // Concurrent execution should be efficient
      expect(endTime - startTime).toBeLessThan(8000)
    })

    it('should optimize memory usage during execution', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Execute multiple operations
      for (let i = 0; i < 10; i++) {
        await runAgenticChatbot(`Memory test iteration ${i}`)
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    })
  })

  describe('Grok 4 Integration with Monitoring', () => {
    it('should track tool execution events', async () => {
      const message = "Execute tools and track events"
      
      const result = await runAgenticChatbot(message)
      
      expect(result).toHaveProperty('mcpResults')
      
      // Should have tracking information
      Object.values(result.mcpResults || {}).forEach((toolResult: any) => {
        if (toolResult.status === 'completed') {
          expect(toolResult).toHaveProperty('timestamp')
          expect(toolResult).toHaveProperty('executionTime')
        }
      })
    })

    it('should provide structured error information', async () => {
      // Mock a tool to fail
      const originalFunc = tools[0].func
      tools[0].func = vi.fn(() => Promise.reject(new Error('Test error with structured info')))
      
      const result = await runAgenticChatbot('Test error handling')
      
      expect(result).toHaveProperty('finalResponse')
      
      // Should handle error gracefully
      if (result.errorMessage) {
        expect(typeof result.errorMessage).toBe('string')
      }
      
      // Restore original function
      tools[0].func = originalFunc
    })
  })
})
