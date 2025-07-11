# Comprehensive Testing Guide for Ozza-Reboot

## Overview

This document provides complete guidance for testing the Ozza-Reboot application, including unit tests, integration tests, and end-to-end (E2E) tests with comprehensive coverage of Grok 4, monitoring, security, and all SaaS features.

## 🎯 Testing Strategy

### Coverage Goals
- **Overall Coverage**: 80%+ across all metrics
- **Critical Modules**: 85%+ coverage for core functionality
- **Security Features**: 95%+ coverage for authentication, authorization, and security
- **Grok 4 Integration**: 90%+ coverage for AI/LLM functionality
- **Monitoring**: 85%+ coverage for error tracking and analytics

### Test Categories
1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and database interactions
3. **E2E Tests**: Complete user workflows
4. **Performance Tests**: Load and response time testing
5. **Security Tests**: Authentication, authorization, and vulnerability testing

## 🏗️ Test Structure

```
tests/
├── setup.ts                    # Global test setup and mocks
├── mocks/
│   └── server.ts               # MSW server for API mocking
├── unit/                       # Unit tests
│   ├── langgraph-chatbot.test.ts    # Grok 4 and LangGraph tests
│   ├── monitoring.test.ts           # Sentry/PostHog integration tests
│   ├── security.test.ts             # Security and 2FA tests
│   └── subscription.test.ts         # Billing and subscription tests
├── integration/                # Integration tests
│   ├── chat-api.test.ts            # Chat API with Grok 4 tools
│   ├── admin-logs-api.test.ts      # Admin logs and filtering
│   ├── coach-metrics-api.test.ts   # Coach analytics API
│   └── marketplace-api.test.ts     # Marketplace functionality
└── e2e/                        # End-to-end tests
    ├── complete-user-flow.spec.ts  # Full user journey
    ├── grok4-features.spec.ts      # Grok 4 specific features
    └── admin-workflows.spec.ts     # Admin-specific workflows
```

## 🚀 Getting Started

### Prerequisites

1. **Node.js 20+**
2. **pnpm package manager**
3. **PostgreSQL** (for integration tests)
4. **Redis** (for rate limiting tests)
5. **Docker** (optional, for service containers)

### Installation

```bash
# Install all dependencies including test dependencies
pnpm install

# Install Playwright browsers for E2E tests
pnpm exec playwright install --with-deps

# Setup test database (optional)
pnpm test:setup
```

### Environment Setup

Create a `.env.test` file:

```env
# Test Environment
NODE_ENV=test

# Database
DATABASE_URL=postgresql://test:test@localhost:5432/test_db

# AI/LLM Configuration
LLM_PROVIDER=xai
XAI_MODEL_ID=grok-4-0709
XAI_API_KEY=test-xai-key
OPENAI_API_KEY=test-openai-key

# Authentication
BETTER_AUTH_SECRET=test-secret-key-for-testing-only-32-chars

# Monitoring
SENTRY_DSN=https://test@sentry.io/test
NEXT_PUBLIC_SENTRY_DSN=https://test@sentry.io/test
POSTHOG_KEY=test-posthog-key
NEXT_PUBLIC_POSTHOG_KEY=test-posthog-key

# Redis/Caching
UPSTASH_REDIS_REST_URL=http://localhost:6379
UPSTASH_REDIS_REST_TOKEN=test-token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Running Tests

### Quick Commands

```bash
# Run all tests
pnpm test:ci

# Run specific test types
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests only
pnpm test:e2e          # E2E tests only

# Coverage and reporting
pnpm test:coverage     # Run with coverage report
pnpm test:watch        # Watch mode for development

# Setup and utilities
pnpm test:setup        # Setup test database
```

### Detailed Test Execution

#### Unit Tests
```bash
# Run all unit tests
pnpm test:unit

# Run specific test file
pnpm vitest tests/unit/langgraph-chatbot.test.ts

# Run tests in watch mode during development
pnpm test:watch

# Run with specific pattern
pnpm vitest --grep "Grok 4"
```

#### Integration Tests
```bash
# Start required services first
docker-compose up -d postgres redis

# Run integration tests
pnpm test:integration

# Run specific integration test
pnpm vitest tests/integration/chat-api.test.ts
```

#### E2E Tests
```bash
# Build the application first
pnpm build

# Run all E2E tests
pnpm test:e2e

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test --headed

# Run specific E2E test
pnpm exec playwright test tests/e2e/complete-user-flow.spec.ts

# Debug E2E tests
pnpm exec playwright test --debug
```

#### Coverage Reports
```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open coverage/index.html

# Check coverage thresholds
pnpm vitest run --coverage --reporter=verbose
```

## 🔧 Test Configuration

### Vitest Configuration (`vitest.config.ts`)

Key features:
- **JSdom environment** for React component testing
- **80% coverage thresholds** with higher thresholds for critical modules
- **MSW integration** for API mocking
- **Path aliases** matching the application structure
- **Parallel execution** with fork pool for isolation

### Playwright Configuration (`playwright.config.ts`)

Key features:
- **Multi-browser testing** (Chrome, Firefox, Safari)
- **Mobile and tablet testing** (iPhone, iPad, Pixel)
- **Visual regression testing** with screenshots
- **Performance monitoring** integration
- **Automatic retry** on failure
- **Parallel execution** for faster test runs

## 🎭 Mocking Strategy

### API Mocking with MSW

We use Mock Service Worker (MSW) to intercept and mock external API calls:

```typescript
// Mock xAI Grok 4 API with structured outputs
http.post('https://api.x.ai/v1/chat/completions', async ({ request }) => {
  const body = await request.json() as any
  
  // Mock Grok 4 parameter validation
  if (body.presence_penalty !== undefined) {
    return HttpResponse.json({
      error: {
        message: 'Invalid parameter: presence_penalty not supported in Grok 4',
        type: 'invalid_request_error'
      }
    }, { status: 400 })
  }
  
  // Mock tool calls based on message content
  if (body.messages[0].content.includes('weather')) {
    return HttpResponse.json({
      choices: [{
        message: {
          tool_calls: [{
            function: {
              name: 'get_current_temperature',
              arguments: JSON.stringify({
                location: 'San Francisco, CA',
                unit: 'fahrenheit',
                includeExtended: true
              })
            }
          }]
        }
      }]
    })
  }
})
```

### Database Mocking

Database operations are mocked using Vitest mocks with realistic data:

```typescript
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([mockSecurityEvents]))
    }))
  })),
  insert: vi.fn(() => ({
    into: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ id: 'new-id' }]))
    }))
  }))
}
```

## 📊 Test Categories and Examples

### Unit Tests

#### Grok 4 LangGraph Integration (`tests/unit/langgraph-chatbot.test.ts`)

**Key Test Areas:**
- Grok 4 model configuration and 256K context window
- Structured output validation with Zod schemas
- Parallel tool execution performance
- Tool security (path traversal prevention)
- Multi-agent coordination with Heavy tier
- Error handling and parameter compatibility

**Example Test:**
```typescript
it('should execute parallel tools with Grok 4 structured outputs', async () => {
  const message = "Get weather and search for AI news simultaneously"
  
  const result = await runAgenticChatbot(message)
  
  expect(result.mcpResults).toHaveProperty('get_current_temperature')
  expect(result.mcpResults).toHaveProperty('web_search')
  
  // Validate structured outputs
  const weatherResult = result.mcpResults.get_current_temperature
  expect(() => TemperatureResponseSchema.parse(weatherResult.result)).not.toThrow()
  expect(weatherResult.result).toHaveProperty('humidity')
  expect(weatherResult.result).toHaveProperty('windSpeed')
})
```

#### Monitoring Integration (`tests/unit/monitoring.test.ts`)

**Key Test Areas:**
- PostHog event tracking (client and server-side)
- Sentry error capture with PII filtering
- Security event logging to database
- Usage overage detection and alerting
- Admin logs retrieval with filtering
- Performance monitoring and transactions

**Example Test:**
```typescript
it('should track Grok 4 events with structured data', async () => {
  await trackEvent('agent_chat_completed', {
    sessionId: 'test-session',
    agentId: 'grok4-agent',
    toolsUsed: ['weather', 'search'],
    parallelExecution: true,
    duration: 1500
  }, 'user-id')

  expect(mockPostHogServer.capture).toHaveBeenCalledWith({
    distinctId: 'user-id',
    event: 'agent_chat_completed',
    properties: expect.objectContaining({
      parallelExecution: true,
      toolsUsed: ['weather', 'search']
    })
  })
})
```

#### Security Features (`tests/unit/security.test.ts`)

**Key Test Areas:**
- Rate limiting for different endpoint types
- 2FA TOTP generation and validation
- Input sanitization and XSS prevention
- Password hashing and verification
- PII filtering in logs and errors
- Admin access control

### Integration Tests

#### Chat API with Grok 4 (`tests/integration/chat-api.test.ts`)

**Key Test Areas:**
- Basic chat requests with authentication
- Grok 4 tool execution (weather, search, email, database, file)
- Parallel tool execution performance
- Streaming responses with structured outputs
- Session management and persistence
- Error handling and recovery

**Example Test:**
```typescript
it('should handle Grok 4 parallel tool execution', async () => {
  const chatRequest = {
    message: 'Get weather for SF and search for AI news in parallel',
    sessionId: 'test-session-id'
  }

  const result = await runAgenticChatbot(chatRequest.message)

  expect(Object.keys(result.mcpResults)).toHaveLength(2)
  expect(result.mcpResults).toHaveProperty('get_current_temperature')
  expect(result.mcpResults).toHaveProperty('web_search')
  
  // Verify parallel execution timing
  const weatherTime = result.mcpResults.get_current_temperature.executionTime
  const searchTime = result.mcpResults.web_search.executionTime
  expect(weatherTime).toBeLessThan(5000)
  expect(searchTime).toBeLessThan(5000)
})
```

#### Admin Logs API (`tests/integration/admin-logs-api.test.ts`)

**Key Test Areas:**
- Authentication and admin role verification
- Security logs retrieval with filtering
- Pagination and sorting functionality
- CSV export generation
- Real-time log updates
- Performance with large datasets

### E2E Tests

#### Complete User Flow (`tests/e2e/complete-user-flow.spec.ts`)

**Complete Journey:**
1. **User Signup** → Email verification and account creation
2. **Enable 2FA** → QR code generation and verification
3. **Agent Chat with Grok 4** → Weather queries and parallel tools
4. **Marketplace Sharing** → Create and publish agent
5. **Admin Logs** → Security monitoring and export
6. **Coach ROI Tracking** → Revenue analytics and reporting

**Example E2E Test:**
```typescript
test('Complete User Journey: Signup → 2FA → Grok 4 Chat → Marketplace → Admin → ROI', async () => {
  // Step 1: User Signup
  await page.goto('/sign-up')
  await page.fill('[data-testid="email-input"]', 'newuser@example.com')
  await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
  await page.click('[data-testid="signup-button"]')
  await expect(page).toHaveURL(/\/dashboard/)

  // Step 2: Enable 2FA
  await page.goto('/dashboard/settings')
  await page.click('[data-testid="enable-2fa-button"]')
  await expect(page.locator('[data-testid="2fa-qr-code"]')).toBeVisible()
  
  // Step 3: Grok 4 Chat with parallel tools
  await page.goto('/dashboard/chat')
  await page.fill('[data-testid="chat-input"]', 'Get weather and search news simultaneously')
  await page.click('[data-testid="send-button"]')
  await expect(page.locator('[data-testid="parallel-execution-indicator"]')).toBeVisible()
  
  // Continue with marketplace, admin, and ROI steps...
})
```

## 🔒 Security Testing

### Authentication Tests
- Login/logout flows
- Session management
- Password reset functionality
- 2FA setup and verification

### Authorization Tests
- Role-based access control
- Admin-only route protection
- API endpoint permissions
- Resource ownership validation

### Input Validation Tests
- XSS prevention
- SQL injection protection
- Path traversal prevention
- Rate limiting enforcement

### Example Security Test:
```typescript
it('should prevent unauthorized admin access', async () => {
  // Mock regular user (non-admin)
  mockAuth.api.getSession.mockResolvedValueOnce({
    user: { id: 'user-id', role: 'user' }
  })

  // Should log security event and deny access
  expect(mockMonitoring.logSecurityEvent).toHaveBeenCalledWith(
    'unauthorized_admin_access',
    expect.objectContaining({
      path: '/api/admin/logs',
      userId: 'user-id'
    }),
    'user-id',
    'high'
  )
})
```

## 📈 Performance Testing

### Load Testing
```typescript
it('should handle concurrent Grok 4 requests efficiently', async () => {
  const requests = Array.from({ length: 10 }, (_, i) => 
    runAgenticChatbot(`Concurrent Grok 4 test ${i}`)
  )
  
  const startTime = Date.now()
  const results = await Promise.all(requests)
  const endTime = Date.now()
  
  expect(results).toHaveLength(10)
  expect(endTime - startTime).toBeLessThan(8000) // 8 seconds for 10 requests
})
```

### Memory Testing
```typescript
it('should not leak memory during streaming', async () => {
  const initialMemory = process.memoryUsage().heapUsed
  
  for (let i = 0; i < 50; i++) {
    for await (const step of streamAgenticChatbot('test')) {
      // Process streaming response
    }
  }
  
  global.gc?.() // Force garbage collection
  const finalMemory = process.memoryUsage().heapUsed
  
  expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024) // 50MB
})
```

## 🚨 Error Handling Tests

### API Error Scenarios
- Network timeouts
- Invalid responses
- Rate limit exceeded
- Authentication failures

### Grok 4 Specific Errors
- Deprecated parameter rejection
- Context window overflow
- Tool execution failures
- Parallel execution errors

### Example Error Test:
```typescript
it('should handle Grok 4 parameter incompatibility', async () => {
  // Test that deprecated parameters are rejected
  const mockResponse = {
    error: {
      message: 'Invalid parameter: presence_penalty not supported in Grok 4',
      type: 'invalid_request_error'
    }
  }
  
  // Verify error handling in application
  expect(mockResponse.error.message).toContain('presence_penalty')
})
```

## 📊 Coverage and Reporting

### Coverage Thresholds
```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'lib/langgraph-chatbot.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'lib/monitoring.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
}
```

### Coverage Reports
- **HTML Report**: `coverage/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **JSON Report**: `coverage/coverage-final.json`
- **Text Summary**: Console output

## 🔄 CI/CD Integration

### GitHub Actions Workflow
The CI pipeline runs automatically on push and PR:

1. **Lint and Type Check** (5 min)
2. **Unit Tests** (10 min)
3. **Integration Tests** (15 min)
4. **E2E Tests** (25 min)
5. **Coverage Report** (10 min)
6. **Security Scan** (5 min)
7. **Performance Tests** (15 min)
8. **Build and Deploy** (10 min)

### Pipeline Features
- **Parallel execution** for faster feedback
- **Artifact uploads** for test results and coverage
- **Slack notifications** for deployment status
- **Automatic retries** for flaky tests
- **Performance budgets** with Lighthouse CI

## 🐛 Debugging Tests

### Debug Unit Tests
```bash
# Debug with Node.js inspector
pnpm vitest --inspect-brk tests/unit/langgraph-chatbot.test.ts

# Debug specific test
pnpm vitest --grep "Grok 4 parallel execution" --reporter=verbose
```

### Debug E2E Tests
```bash
# Debug mode with browser visible
pnpm exec playwright test --debug

# Headed mode
pnpm exec playwright test --headed

# Trace viewer
pnpm exec playwright show-trace trace.zip
```

### Debug Integration Tests
```bash
# Verbose logging
DEBUG=* pnpm test:integration

# Database query logging
DATABASE_LOGGING=true pnpm test:integration
```

## 🎯 Best Practices

### Test Organization
1. **Arrange-Act-Assert** pattern
2. **Descriptive test names** that explain the scenario
3. **Single responsibility** per test
4. **Consistent test data** using factories

### Performance
1. **Parallel execution** when possible
2. **Mock external services** to avoid network calls
3. **Database transactions** for test isolation
4. **Cleanup after tests** to prevent interference

### Maintenance
1. **Regular dependency updates**
2. **Flaky test identification** and fixing
3. **Test documentation** updates
4. **Refactoring** tests alongside code

## 🔧 Troubleshooting

### Common Issues

#### Tests Timing Out
```bash
# Increase timeout in vitest.config.ts
testTimeout: 15000  # 15 seconds
```

#### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset test database
pnpm test:setup
```

#### E2E Tests Failing
```bash
# Update Playwright browsers
pnpm exec playwright install

# Check application is running
curl http://localhost:3000/api/health
```

#### Coverage Issues
```bash
# Check excluded files in vitest.config.ts
# Ensure test files are in correct directories
# Verify import paths are correct
```

### Getting Help

1. **Check test logs** for detailed error messages
2. **Run tests individually** to isolate issues
3. **Verify environment setup** matches requirements
4. **Check GitHub Actions** for CI-specific issues
5. **Review MSW mocks** for API-related test failures

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library](https://testing-library.com/)
- [Grok 4 API Documentation](https://docs.x.ai/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)

## 🎉 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure 80%+ coverage** for new code
3. **Add integration tests** for new APIs
4. **Update E2E tests** for new user flows
5. **Document testing patterns** for complex features
6. **Test Grok 4 compatibility** for AI features
7. **Verify monitoring integration** for new events

---

This comprehensive testing suite ensures Ozza-Reboot maintains high quality, security, and performance standards while supporting advanced features like Grok 4 AI integration, real-time monitoring, and enterprise-scale functionality.
