import { test, expect, Page } from '@playwright/test'

test.describe('Complete User Flow E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // Set up test environment
    await page.goto('/')
    
    // Mock API responses for consistent testing
    await page.route('**/api/auth/**', async route => {
      const url = route.request().url()
      if (url.includes('session')) {
        await route.fulfill({
          json: {
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
          }
        })
      } else {
        await route.continue()
      }
    })

    // Mock xAI Grok 4 API responses
    await page.route('**/api.x.ai/v1/chat/completions', async route => {
      const requestBody = await route.request().postDataJSON()
      const message = requestBody.messages?.[requestBody.messages.length - 1]?.content || ''
      
      if (message.includes('weather')) {
        await route.fulfill({
          json: {
            id: 'chatcmpl-grok4-test',
            object: 'chat.completion',
            created: Date.now(),
            model: 'grok-4-0709',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
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
              },
              finish_reason: 'tool_calls'
            }],
            usage: {
              prompt_tokens: 120,
              completion_tokens: 35,
              total_tokens: 155
            }
          }
        })
      } else {
        await route.fulfill({
          json: {
            id: 'chatcmpl-grok4-default',
            object: 'chat.completion',
            created: Date.now(),
            model: 'grok-4-0709',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: 'This is a Grok 4 response with enhanced reasoning capabilities.',
                tool_calls: null
              },
              finish_reason: 'stop'
            }],
            usage: {
              prompt_tokens: 50,
              completion_tokens: 25,
              total_tokens: 75
            }
          }
        })
      }
    })

    // Mock chat API
    await page.route('**/api/chat', async route => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON()
        const message = requestBody.message
        
        let response = {
          response: 'I understand your message and here is my Grok 4 enhanced response.',
          sessionId: requestBody.sessionId,
          agentName: 'Grok 4 Agent',
          executionSteps: ['Planning', 'Execution', 'Response']
        }
        
        if (message.includes('weather')) {
          response.response = 'The weather in San Francisco is 72°F and sunny with Grok 4 enhanced analysis.'
        }
        
        await route.fulfill({ json: response })
      } else {
        await route.continue()
      }
    })

    // Mock admin APIs
    await page.route('**/api/admin/logs', async route => {
      await route.fulfill({
        json: {
          logs: [
            {
              id: 'log-1',
              eventType: 'security_login_attempt',
              severity: 'medium',
              details: {
                userAgent: 'Test Browser',
                timestamp: new Date().toISOString()
              },
              userId: 'test-user-id',
              userName: 'Test User',
              createdAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 50,
            total: 1,
            totalPages: 1
          }
        }
      })
    })

    // Mock marketplace API
    await page.route('**/api/marketplace', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          json: {
            success: true,
            agentId: 'shared-agent-id',
            shareUrl: 'https://marketplace.ozza.ai/agent/shared-agent-id'
          }
        })
      } else {
        await route.fulfill({
          json: {
            agents: [
              {
                id: 'marketplace-agent-1',
                name: 'Weather Assistant',
                description: 'Get weather information with Grok 4',
                downloads: 150,
                rating: 4.8,
                author: 'Test Creator'
              }
            ]
          }
        })
      }
    })

    // Mock coach metrics API
    await page.route('**/api/coach-metrics', async route => {
      await route.fulfill({
        json: {
          totalRevenue: 2500,
          activeClients: 15,
          conversionRate: 0.15,
          monthlyGrowth: 0.12,
          topAgents: [
            {
              id: 'agent-1',
              name: 'Business Coach AI',
              revenue: 1200,
              clients: 8
            }
          ]
        }
      })
    })
  })

  test('Complete User Journey: Signup → 2FA → Agent Chat → Marketplace → Admin Logs → Coach ROI', async () => {
    // Step 1: User Signup
    await test.step('User Signup', async () => {
      await page.goto('/sign-up')
      
      await page.fill('[data-testid="email-input"]', 'newuser@example.com')
      await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
      await page.fill('[data-testid="name-input"]', 'New Test User')
      
      await page.click('[data-testid="signup-button"]')
      
      // Should redirect to dashboard or onboarding
      await expect(page).toHaveURL(/\/(dashboard|onboarding)/)
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })

    // Step 2: Enable 2FA
    await test.step('Enable Two-Factor Authentication', async () => {
      await page.goto('/dashboard/settings')
      
      // Navigate to security settings
      await page.click('[data-testid="security-tab"]')
      
      // Enable 2FA
      await page.click('[data-testid="enable-2fa-button"]')
      
      // Should show QR code or setup instructions
      await expect(page.locator('[data-testid="2fa-qr-code"]')).toBeVisible()
      
      // Enter verification code (mock)
      await page.fill('[data-testid="2fa-code-input"]', '123456')
      await page.click('[data-testid="verify-2fa-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="2fa-success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="2fa-status"]')).toContainText('Enabled')
    })

    // Step 3: Agent Chat with Grok 4
    await test.step('Agent Chat with Grok 4', async () => {
      await page.goto('/dashboard/chat')
      
      // Should see chat interface
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="grok4-indicator"]')).toBeVisible()
      
      // Send a weather query to test Grok 4 tool calling
      await page.fill('[data-testid="chat-input"]', 'What is the weather like in San Francisco?')
      await page.click('[data-testid="send-button"]')
      
      // Should see Grok 4 response with weather data
      await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('72°F')
      await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('Grok 4')
      
      // Verify tool execution indicator
      await expect(page.locator('[data-testid="tool-execution-indicator"]')).toBeVisible()
      
      // Test parallel tool execution
      await page.fill('[data-testid="chat-input"]', 'Get weather and search for AI news simultaneously')
      await page.click('[data-testid="send-button"]')
      
      // Should show parallel execution
      await expect(page.locator('[data-testid="parallel-execution-indicator"]')).toBeVisible()
      await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('parallel')
    })

    // Step 4: Create and Share Agent to Marketplace
    await test.step('Create and Share Agent to Marketplace', async () => {
      await page.goto('/dashboard/agents')
      
      // Create new agent
      await page.click('[data-testid="create-agent-button"]')
      
      await page.fill('[data-testid="agent-name-input"]', 'Weather Assistant Pro')
      await page.fill('[data-testid="agent-description-input"]', 'Advanced weather assistant powered by Grok 4')
      
      // Configure Grok 4 settings
      await page.click('[data-testid="model-select"]')
      await page.click('[data-testid="grok-4-option"]')
      
      // Enable structured outputs
      await page.check('[data-testid="structured-outputs-checkbox"]')
      
      // Select tools
      await page.check('[data-testid="weather-tool-checkbox"]')
      await page.check('[data-testid="search-tool-checkbox"]')
      
      await page.click('[data-testid="save-agent-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="agent-created-success"]')).toBeVisible()
      
      // Share to marketplace
      await page.click('[data-testid="share-to-marketplace-button"]')
      
      // Fill marketplace details
      await page.fill('[data-testid="marketplace-title"]', 'Weather Assistant Pro')
      await page.fill('[data-testid="marketplace-description"]', 'Get accurate weather with Grok 4 AI')
      await page.selectOption('[data-testid="marketplace-category"]', 'productivity')
      
      await page.click('[data-testid="publish-to-marketplace-button"]')
      
      // Should show success and share URL
      await expect(page.locator('[data-testid="marketplace-share-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="share-url"]')).toBeVisible()
    })

    // Step 5: Browse Marketplace
    await test.step('Browse Marketplace', async () => {
      await page.goto('/dashboard/marketplace')
      
      // Should see marketplace with agents
      await expect(page.locator('[data-testid="marketplace-grid"]')).toBeVisible()
      await expect(page.locator('[data-testid="agent-card"]').first()).toBeVisible()
      
      // Filter by category
      await page.selectOption('[data-testid="category-filter"]', 'productivity')
      
      // Search for agents
      await page.fill('[data-testid="marketplace-search"]', 'weather')
      await page.press('[data-testid="marketplace-search"]', 'Enter')
      
      // Should show filtered results
      await expect(page.locator('[data-testid="agent-card"]')).toContainText('Weather')
      
      // Download an agent
      await page.click('[data-testid="download-agent-button"]')
      await expect(page.locator('[data-testid="download-success"]')).toBeVisible()
    })

    // Step 6: View Admin Logs (if admin user)
    await test.step('View Admin Logs', async () => {
      // Mock admin user
      await page.route('**/api/auth/session', async route => {
        await route.fulfill({
          json: {
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
          }
        })
      })
      
      await page.goto('/dashboard/admin/logs')
      
      // Should see admin logs dashboard
      await expect(page.locator('[data-testid="admin-logs-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="security-events-table"]')).toBeVisible()
      
      // Test filtering
      await page.selectOption('[data-testid="severity-filter"]', 'high')
      await page.click('[data-testid="apply-filters-button"]')
      
      // Should show filtered results
      await expect(page.locator('[data-testid="log-entry"]')).toBeVisible()
      
      // Test date range filter
      await page.click('[data-testid="date-range-picker"]')
      await page.click('[data-testid="last-7-days"]')
      
      // Test export functionality
      await page.click('[data-testid="export-logs-button"]')
      
      // Should trigger download
      const downloadPromise = page.waitForEvent('download')
      await downloadPromise
      
      // Switch to analytics tab
      await page.click('[data-testid="analytics-tab"]')
      await expect(page.locator('[data-testid="chat-analytics-chart"]')).toBeVisible()
    })

    // Step 7: Coach Mode ROI Tracking
    await test.step('Coach Mode ROI Tracking', async () => {
      await page.goto('/dashboard/coach')
      
      // Should see coach dashboard
      await expect(page.locator('[data-testid="coach-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="revenue-metric"]')).toBeVisible()
      
      // Check revenue metrics
      await expect(page.locator('[data-testid="total-revenue"]')).toContainText('$2,500')
      await expect(page.locator('[data-testid="active-clients"]')).toContainText('15')
      await expect(page.locator('[data-testid="conversion-rate"]')).toContainText('15%')
      
      // View detailed analytics
      await page.click('[data-testid="view-analytics-button"]')
      
      // Should show detailed ROI breakdown
      await expect(page.locator('[data-testid="roi-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="agent-performance-table"]')).toBeVisible()
      
      // Test time range selection
      await page.selectOption('[data-testid="time-range-select"]', '30d')
      
      // Should update charts
      await expect(page.locator('[data-testid="roi-chart"]')).toBeVisible()
      
      // Export ROI report
      await page.click('[data-testid="export-roi-report"]')
      
      // Should trigger download
      const roiDownloadPromise = page.waitForEvent('download')
      await roiDownloadPromise
    })

    // Step 8: Verify Monitoring Integration
    await test.step('Verify Monitoring Integration', async () => {
      // Check that PostHog events were tracked
      // This would be verified through network requests in a real test
      
      // Verify Sentry error tracking setup
      await page.goto('/dashboard/settings')
      await page.click('[data-testid="monitoring-tab"]')
      
      // Should show monitoring status
      await expect(page.locator('[data-testid="posthog-status"]')).toContainText('Connected')
      await expect(page.locator('[data-testid="sentry-status"]')).toContainText('Connected')
      
      // Test error reporting
      await page.click('[data-testid="test-error-reporting"]')
      await expect(page.locator('[data-testid="error-test-success"]')).toBeVisible()
    })
  })

  test('Grok 4 Specific Features Flow', async () => {
    await test.step('Test Grok 4 Enhanced Features', async () => {
      await page.goto('/dashboard/chat')
      
      // Test 256K context window
      const longMessage = 'Analyze this large dataset: ' + 'x'.repeat(5000) + ' and provide insights'
      await page.fill('[data-testid="chat-input"]', longMessage)
      await page.click('[data-testid="send-button"]')
      
      // Should handle large context without error
      await expect(page.locator('[data-testid="chat-message"]').last()).toBeVisible()
      await expect(page.locator('[data-testid="context-indicator"]')).toContainText('256K')
      
      // Test structured outputs
      await page.fill('[data-testid="chat-input"]', 'Get structured weather data for multiple cities')
      await page.click('[data-testid="send-button"]')
      
      // Should show structured output indicator
      await expect(page.locator('[data-testid="structured-output-indicator"]')).toBeVisible()
      
      // Test parallel tool execution
      await page.fill('[data-testid="chat-input"]', 'Execute weather, search, and database tools in parallel')
      await page.click('[data-testid="send-button"]')
      
      // Should show parallel execution with timing
      await expect(page.locator('[data-testid="parallel-execution-timer"]')).toBeVisible()
      await expect(page.locator('[data-testid="tool-execution-count"]')).toContainText('3')
    })
  })

  test('Security and Rate Limiting Flow', async () => {
    await test.step('Test Rate Limiting', async () => {
      await page.goto('/dashboard/chat')
      
      // Send multiple rapid requests to trigger rate limiting
      for (let i = 0; i < 35; i++) {
        await page.fill('[data-testid="chat-input"]', `Rate limit test message ${i}`)
        await page.click('[data-testid="send-button"]')
        
        if (i > 30) {
          // Should show rate limit warning
          await expect(page.locator('[data-testid="rate-limit-warning"]')).toBeVisible()
          break
        }
      }
    })

    await test.step('Test 2FA Login Flow', async () => {
      // Logout first
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')
      
      // Login with 2FA enabled user
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'user-with-2fa@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      // Should prompt for 2FA code
      await expect(page.locator('[data-testid="2fa-prompt"]')).toBeVisible()
      
      // Enter 2FA code
      await page.fill('[data-testid="2fa-code-input"]', '123456')
      await page.click('[data-testid="verify-2fa-button"]')
      
      // Should login successfully
      await expect(page).toHaveURL(/\/dashboard/)
    })
  })

  test('Error Handling and Recovery Flow', async () => {
    await test.step('Test API Error Handling', async () => {
      // Mock API error
      await page.route('**/api/chat', async route => {
        await route.fulfill({
          status: 500,
          json: { error: 'Internal server error' }
        })
      })
      
      await page.goto('/dashboard/chat')
      await page.fill('[data-testid="chat-input"]', 'This should trigger an error')
      await page.click('[data-testid="send-button"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
      
      // Test retry functionality
      await page.route('**/api/chat', async route => {
        await route.fulfill({
          json: {
            response: 'Retry successful',
            sessionId: 'test-session'
          }
        })
      })
      
      await page.click('[data-testid="retry-button"]')
      await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('Retry successful')
    })

    await test.step('Test Network Offline Handling', async () => {
      // Simulate offline
      await page.context().setOffline(true)
      
      await page.goto('/dashboard/chat')
      await page.fill('[data-testid="chat-input"]', 'Test offline message')
      await page.click('[data-testid="send-button"]')
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
      
      // Go back online
      await page.context().setOffline(false)
      
      // Should automatically retry
      await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible()
    })
  })

  test('Performance and Accessibility Flow', async () => {
    await test.step('Test Performance Metrics', async () => {
      await page.goto('/dashboard')
      
      // Measure page load time
      const startTime = Date.now()
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(3000)
      
      // Test chat response time
      await page.goto('/dashboard/chat')
      const chatStartTime = Date.now()
      await page.fill('[data-testid="chat-input"]', 'Quick response test')
      await page.click('[data-testid="send-button"]')
      await page.waitForSelector('[data-testid="chat-message"]:last-child')
      const chatResponseTime = Date.now() - chatStartTime
      
      // Should respond within reasonable time
      expect(chatResponseTime).toBeLessThan(5000)
    })

    await test.step('Test Accessibility', async () => {
      await page.goto('/dashboard')
      
      // Test keyboard navigation
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
      
      // Test screen reader compatibility
      const chatInput = page.locator('[data-testid="chat-input"]')
      await expect(chatInput).toHaveAttribute('aria-label')
      
      // Test color contrast (would need additional tools in real test)
      const backgroundColor = await page.locator('body').evaluate(el => 
        getComputedStyle(el).backgroundColor
      )
      expect(backgroundColor).toBeDefined()
    })
  })
})

test.describe('Mobile Responsive Flow', () => {
  test('Complete flow on mobile device', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone SE
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    })
    
    const page = await context.newPage()
    
    await test.step('Mobile Signup and Chat', async () => {
      await page.goto('/sign-up')
      
      // Should be mobile responsive
      await expect(page.locator('[data-testid="mobile-signup-form"]')).toBeVisible()
      
      await page.fill('[data-testid="email-input"]', 'mobile@example.com')
      await page.fill('[data-testid="password-input"]', 'MobilePassword123!')
      await page.fill('[data-testid="name-input"]', 'Mobile User')
      
      await page.click('[data-testid="signup-button"]')
      
      // Navigate to chat on mobile
      await page.click('[data-testid="mobile-menu-button"]')
      await page.click('[data-testid="chat-nav-link"]')
      
      // Should show mobile chat interface
      await expect(page.locator('[data-testid="mobile-chat-interface"]')).toBeVisible()
      
      // Test mobile chat input
      await page.fill('[data-testid="chat-input"]', 'Mobile chat test')
      await page.click('[data-testid="mobile-send-button"]')
      
      await expect(page.locator('[data-testid="chat-message"]').last()).toBeVisible()
    })
    
    await context.close()
  })
})
