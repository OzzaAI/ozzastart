import { test, expect } from '@playwright/test'

test.describe('Signup Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to signup page
    await page.goto('/sign-up')
  })

  test('should complete basic signup flow', async ({ page }) => {
    // Fill signup form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="name-input"]', 'Test User')
    
    // Submit form
    await page.click('[data-testid="signup-button"]')
    
    // Should redirect to dashboard or success page
    await expect(page).toHaveURL(/\/(dashboard|success)/)
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    // Try to submit with invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.click('[data-testid="signup-button"]')
    
    // Should show validation error
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
  })

  test('should handle existing user signup', async ({ page }) => {
    // Fill form with existing user email
    await page.fill('[data-testid="email-input"]', 'existing@example.com')
    await page.fill('[data-testid="password-input"]', 'Password123!')
    await page.fill('[data-testid="name-input"]', 'Existing User')
    
    await page.click('[data-testid="signup-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('already exists')
  })

  test('should navigate to agent chat after signup', async ({ page }) => {
    // Complete signup
    await page.fill('[data-testid="email-input"]', 'newuser@example.com')
    await page.fill('[data-testid="password-input"]', 'NewPassword123!')
    await page.fill('[data-testid="name-input"]', 'New User')
    await page.click('[data-testid="signup-button"]')
    
    // Navigate to chat
    await page.click('[data-testid="chat-nav-link"]')
    await expect(page).toHaveURL(/\/chat/)
    
    // Should see chat interface
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible()
  })

  test('should enable marketplace sharing after agent creation', async ({ page }) => {
    // Complete signup and create agent
    await page.fill('[data-testid="email-input"]', 'creator@example.com')
    await page.fill('[data-testid="password-input"]', 'Creator123!')
    await page.fill('[data-testid="name-input"]', 'Agent Creator')
    await page.click('[data-testid="signup-button"]')
    
    // Create an agent
    await page.click('[data-testid="create-agent-button"]')
    await page.fill('[data-testid="agent-name"]', 'Test Agent')
    await page.fill('[data-testid="agent-description"]', 'A test agent')
    await page.click('[data-testid="save-agent-button"]')
    
    // Share to marketplace
    await page.click('[data-testid="share-marketplace-button"]')
    await expect(page.locator('[data-testid="share-success"]')).toBeVisible()
  })

  test('should track ROI metrics after marketplace activity', async ({ page }) => {
    // Complete full flow to ROI tracking
    await page.fill('[data-testid="email-input"]', 'roi@example.com')
    await page.fill('[data-testid="password-input"]', 'ROI123!')
    await page.fill('[data-testid="name-input"]', 'ROI Tracker')
    await page.click('[data-testid="signup-button"]')
    
    // Navigate to ROI dashboard
    await page.click('[data-testid="roi-nav-link"]')
    await expect(page).toHaveURL(/\/dashboard.*roi/)
    
    // Should see ROI metrics
    await expect(page.locator('[data-testid="roi-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-metric"]')).toBeVisible()
  })
})
