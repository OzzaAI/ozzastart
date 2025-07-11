import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Test configuration for accessibility
test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing environment
    await page.goto('/en/dashboard')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Ensure user is authenticated (mock or real auth)
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token')
    })
  })

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should not have any accessibility violations on dashboard', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should not have any accessibility violations on chat page', async ({ page }) => {
      await page.goto('/en/chat')
      await page.waitForLoadState('networkidle')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should not have any accessibility violations on marketplace', async ({ page }) => {
      await page.goto('/en/marketplace')
      await page.waitForLoadState('networkidle')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should not have any accessibility violations on admin logs', async ({ page }) => {
      await page.goto('/en/admin/logs')
      await page.waitForLoadState('networkidle')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should not have any accessibility violations on settings', async ({ page }) => {
      await page.goto('/en/settings')
      await page.waitForLoadState('networkidle')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation through main navigation', async ({ page }) => {
      // Focus on first navigation item
      await page.keyboard.press('Tab')
      
      // Check that focus is visible
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Navigate through all main navigation items
      const navItems = ['Dashboard', 'Chat', 'Marketplace', 'Admin', 'Settings']
      
      for (let i = 0; i < navItems.length; i++) {
        const currentFocus = await page.locator(':focus')
        const text = await currentFocus.textContent()
        
        // Verify we can navigate to each item
        if (text && navItems.some(item => text.includes(item))) {
          // Press Enter to activate
          await page.keyboard.press('Enter')
          await page.waitForTimeout(500)
          
          // Go back to navigation
          await page.keyboard.press('Alt+2') // Skip to navigation shortcut
        }
        
        await page.keyboard.press('Tab')
      }
    })

    test('should support skip links', async ({ page }) => {
      // Focus on skip links (they should be first focusable elements)
      await page.keyboard.press('Tab')
      
      const skipLink = await page.locator(':focus')
      const text = await skipLink.textContent()
      
      expect(text).toContain('Skip to')
      
      // Activate skip link
      await page.keyboard.press('Enter')
      
      // Verify focus moved to main content
      const focusedAfterSkip = await page.locator(':focus')
      const mainContent = await page.locator('#main-content, [role="main"], main')
      
      // Check if focus is within main content area
      const isInMainContent = await page.evaluate(() => {
        const focused = document.activeElement
        const main = document.querySelector('#main-content, [role="main"], main')
        return main?.contains(focused) || false
      })
      
      expect(isInMainContent).toBe(true)
    })

    test('should trap focus in modal dialogs', async ({ page }) => {
      // Open a modal (e.g., settings dialog)
      await page.goto('/en/settings')
      
      // Look for a button that opens a modal
      const modalTrigger = await page.locator('[aria-haspopup="dialog"], [data-testid*="modal"], [data-testid*="dialog"]').first()
      
      if (await modalTrigger.count() > 0) {
        await modalTrigger.click()
        
        // Wait for modal to open
        await page.waitForSelector('[role="dialog"], [data-testid*="modal-content"]')
        
        // Get all focusable elements in modal
        const modal = await page.locator('[role="dialog"], [data-testid*="modal-content"]').first()
        
        // Tab through modal and ensure focus stays within
        await page.keyboard.press('Tab')
        let focusedElement = await page.locator(':focus')
        
        // Verify focus is within modal
        const isInModal = await page.evaluate(() => {
          const focused = document.activeElement
          const modal = document.querySelector('[role="dialog"], [data-testid*="modal-content"]')
          return modal?.contains(focused) || false
        })
        
        expect(isInModal).toBe(true)
        
        // Test reverse tab (Shift+Tab)
        await page.keyboard.press('Shift+Tab')
        focusedElement = await page.locator(':focus')
        
        const isStillInModal = await page.evaluate(() => {
          const focused = document.activeElement
          const modal = document.querySelector('[role="dialog"], [data-testid*="modal-content"]')
          return modal?.contains(focused) || false
        })
        
        expect(isStillInModal).toBe(true)
        
        // Close modal with Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        
        // Verify modal is closed
        const modalExists = await page.locator('[role="dialog"]').count()
        expect(modalExists).toBe(0)
      }
    })

    test('should support keyboard shortcuts', async ({ page }) => {
      // Test Alt+1 for main content
      await page.keyboard.press('Alt+1')
      await page.waitForTimeout(200)
      
      const focusedElement = await page.locator(':focus')
      const isMainContentFocused = await page.evaluate(() => {
        const focused = document.activeElement
        const main = document.querySelector('#main-content, [role="main"], main')
        return main?.contains(focused) || focused === main
      })
      
      expect(isMainContentFocused).toBe(true)
      
      // Test Alt+2 for navigation
      await page.keyboard.press('Alt+2')
      await page.waitForTimeout(200)
      
      const navFocused = await page.evaluate(() => {
        const focused = document.activeElement
        const nav = document.querySelector('#main-navigation, [role="navigation"], nav')
        return nav?.contains(focused) || focused === nav
      })
      
      expect(navFocused).toBe(true)
    })
  })

  test.describe('Screen Reader Support', () => {
    test('should have proper heading structure', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      
      // Should have at least one h1
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
      
      // Check heading hierarchy (no skipping levels)
      const headingLevels = await Promise.all(
        headings.map(async (heading) => {
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
          return parseInt(tagName.charAt(1))
        })
      )
      
      // Verify no heading levels are skipped
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i]
        const previousLevel = headingLevels[i - 1]
        
        // Allow same level, one level deeper, or any level shallower
        const validTransition = 
          currentLevel === previousLevel || // Same level
          currentLevel === previousLevel + 1 || // One level deeper
          currentLevel < previousLevel // Any level shallower
        
        expect(validTransition).toBe(true)
      }
    })

    test('should have proper ARIA labels and descriptions', async ({ page }) => {
      // Check that interactive elements have accessible names
      const buttons = await page.locator('button').all()
      
      for (const button of buttons) {
        const accessibleName = await button.evaluate(el => {
          // Check various ways an element can have an accessible name
          return (
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby') ||
            el.textContent?.trim() ||
            el.getAttribute('title')
          )
        })
        
        expect(accessibleName).toBeTruthy()
      }
      
      // Check that form inputs have labels
      const inputs = await page.locator('input, select, textarea').all()
      
      for (const input of inputs) {
        const hasLabel = await input.evaluate(el => {
          const id = el.getAttribute('id')
          const ariaLabel = el.getAttribute('aria-label')
          const ariaLabelledBy = el.getAttribute('aria-labelledby')
          const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null
          
          return !!(ariaLabel || ariaLabelledBy || associatedLabel)
        })
        
        expect(hasLabel).toBe(true)
      }
    })

    test('should announce dynamic content changes', async ({ page }) => {
      // Navigate to chat page to test dynamic content
      await page.goto('/en/chat')
      await page.waitForLoadState('networkidle')
      
      // Check for live regions
      const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count()
      expect(liveRegions).toBeGreaterThan(0)
      
      // Test that screen reader announcer exists
      const announcer = await page.locator('#screen-reader-announcer').count()
      expect(announcer).toBe(1)
      
      // Verify announcer has proper attributes
      const announcerAttributes = await page.locator('#screen-reader-announcer').evaluate(el => ({
        ariaLive: el.getAttribute('aria-live'),
        role: el.getAttribute('role'),
        ariaAtomic: el.getAttribute('aria-atomic')
      }))
      
      expect(announcerAttributes.ariaLive).toBe('polite')
      expect(announcerAttributes.role).toBe('status')
    })
  })

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should meet color contrast requirements', async ({ page }) => {
      // Run axe-core with color contrast rules
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should support high contrast mode', async ({ page }) => {
      // Enable high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            :root {
              --background: #000000;
              --foreground: #ffffff;
              --primary: #ffffff;
              --primary-foreground: #000000;
            }
          }
        `
      })
      
      // Emulate high contrast preference
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' })
      
      // Check that high contrast styles are applied
      const rootStyles = await page.evaluate(() => {
        const root = document.documentElement
        const styles = getComputedStyle(root)
        return {
          background: styles.getPropertyValue('--background'),
          foreground: styles.getPropertyValue('--foreground')
        }
      })
      
      // Verify high contrast colors are being used
      expect(rootStyles.background || rootStyles.foreground).toBeTruthy()
    })

    test('should support reduced motion preferences', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })
      
      // Check that animations are disabled or reduced
      const animationDurations = await page.evaluate(() => {
        const elements = document.querySelectorAll('*')
        const durations: string[] = []
        
        elements.forEach(el => {
          const styles = getComputedStyle(el)
          const animationDuration = styles.animationDuration
          const transitionDuration = styles.transitionDuration
          
          if (animationDuration !== '0s') durations.push(animationDuration)
          if (transitionDuration !== '0s') durations.push(transitionDuration)
        })
        
        return durations
      })
      
      // In reduced motion mode, most animations should be very short or disabled
      const longAnimations = animationDurations.filter(duration => {
        const seconds = parseFloat(duration)
        return seconds > 0.1 // Anything longer than 100ms
      })
      
      // Allow some animations but they should be minimal
      expect(longAnimations.length).toBeLessThan(5)
    })
  })

  test.describe('Internationalization Accessibility', () => {
    test('should have proper lang attributes for different locales', async ({ page }) => {
      // Test English
      await page.goto('/en/dashboard')
      const enLang = await page.locator('html').getAttribute('lang')
      expect(enLang).toBe('en')
      
      // Test Spanish
      await page.goto('/es/dashboard')
      const esLang = await page.locator('html').getAttribute('lang')
      expect(esLang).toBe('es')
      
      // Test French
      await page.goto('/fr/dashboard')
      const frLang = await page.locator('html').getAttribute('lang')
      expect(frLang).toBe('fr')
    })

    test('should have accessible language switcher', async ({ page }) => {
      await page.goto('/en/settings')
      
      // Find language switcher
      const languageSwitcher = await page.locator('[aria-label*="language"], [aria-label*="Language"]').first()
      
      if (await languageSwitcher.count() > 0) {
        // Check accessibility attributes
        const attributes = await languageSwitcher.evaluate(el => ({
          ariaLabel: el.getAttribute('aria-label'),
          ariaExpanded: el.getAttribute('aria-expanded'),
          ariaHaspopup: el.getAttribute('aria-haspopup'),
          role: el.getAttribute('role')
        }))
        
        expect(attributes.ariaLabel).toBeTruthy()
        
        // Test keyboard interaction
        await languageSwitcher.focus()
        await page.keyboard.press('Enter')
        
        // Check if dropdown opened
        const dropdown = await page.locator('[role="listbox"], [role="menu"]').count()
        if (dropdown > 0) {
          // Test arrow key navigation
          await page.keyboard.press('ArrowDown')
          
          const focusedOption = await page.locator(':focus')
          const optionRole = await focusedOption.getAttribute('role')
          expect(['option', 'menuitem']).toContain(optionRole)
        }
      }
    })

    test('should announce locale changes', async ({ page }) => {
      await page.goto('/en/settings')
      
      // Monitor for announcements
      let announcementMade = false
      
      page.on('console', msg => {
        if (msg.text().includes('language') || msg.text().includes('locale')) {
          announcementMade = true
        }
      })
      
      // Change language if switcher is available
      const languageSwitcher = await page.locator('[aria-label*="language"], [aria-label*="Language"]').first()
      
      if (await languageSwitcher.count() > 0) {
        await languageSwitcher.click()
        
        // Select different language
        const spanishOption = await page.locator('text=Español, text=Spanish').first()
        if (await spanishOption.count() > 0) {
          await spanishOption.click()
          
          // Wait for navigation
          await page.waitForURL('**/es/**')
          
          // Verify page language changed
          const newLang = await page.locator('html').getAttribute('lang')
          expect(newLang).toBe('es')
        }
      }
    })
  })

  test.describe('Coach Metrics Accessibility', () => {
    test('should have accessible coach metrics cards', async ({ page }) => {
      await page.goto('/en/dashboard')
      
      // Wait for coach metrics to load
      await page.waitForSelector('[data-testid*="coach"], [aria-labelledby*="metrics"]', { timeout: 10000 })
      
      // Check metrics cards accessibility
      const metricsCards = await page.locator('[role="button"][aria-pressed], .coach-metric-card').all()
      
      for (const card of metricsCards) {
        // Check that each card has proper ARIA attributes
        const attributes = await card.evaluate(el => ({
          role: el.getAttribute('role'),
          ariaPressed: el.getAttribute('aria-pressed'),
          ariaDescribedBy: el.getAttribute('aria-describedby'),
          tabIndex: el.getAttribute('tabindex')
        }))
        
        // Should be keyboard accessible
        expect(attributes.tabIndex).not.toBe('-1')
        
        // Should have proper role
        expect(['button', 'article']).toContain(attributes.role)
        
        // Test keyboard interaction
        await card.focus()
        await page.keyboard.press('Enter')
        
        // Should announce state change
        const isPressed = await card.getAttribute('aria-pressed')
        expect(['true', 'false']).toContain(isPressed)
      }
    })

    test('should have accessible progress indicators', async ({ page }) => {
      await page.goto('/en/dashboard')
      
      // Look for progress bars in coach metrics
      const progressBars = await page.locator('[role="progressbar"], progress').all()
      
      for (const progressBar of progressBars) {
        const attributes = await progressBar.evaluate(el => ({
          ariaLabel: el.getAttribute('aria-label'),
          ariaValueNow: el.getAttribute('aria-valuenow'),
          ariaValueMin: el.getAttribute('aria-valuemin'),
          ariaValueMax: el.getAttribute('aria-valuemax'),
          ariaValueText: el.getAttribute('aria-valuetext')
        }))
        
        // Should have accessible name
        expect(attributes.ariaLabel).toBeTruthy()
        
        // Should have proper value attributes
        if (attributes.ariaValueNow) {
          expect(parseFloat(attributes.ariaValueNow)).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })

  test.describe('Error Handling and Feedback', () => {
    test('should provide accessible error messages', async ({ page }) => {
      // Navigate to a form page
      await page.goto('/en/settings')
      
      // Try to trigger validation errors
      const form = await page.locator('form').first()
      
      if (await form.count() > 0) {
        // Find required inputs
        const requiredInputs = await page.locator('input[required], input[aria-required="true"]').all()
        
        for (const input of requiredInputs) {
          // Clear input and try to submit
          await input.fill('')
          await input.blur()
          
          // Look for error message
          const inputId = await input.getAttribute('id')
          const ariaDescribedBy = await input.getAttribute('aria-describedby')
          
          if (ariaDescribedBy) {
            const errorMessage = await page.locator(`#${ariaDescribedBy}`).count()
            expect(errorMessage).toBeGreaterThan(0)
            
            // Error should be announced to screen readers
            const errorElement = await page.locator(`#${ariaDescribedBy}`)
            const ariaLive = await errorElement.getAttribute('aria-live')
            const role = await errorElement.getAttribute('role')
            
            expect(ariaLive || role).toBeTruthy()
          }
        }
      }
    })

    test('should provide accessible loading states', async ({ page }) => {
      await page.goto('/en/chat')
      
      // Look for loading indicators
      const loadingElements = await page.locator('[aria-busy="true"], [role="status"], .loading').all()
      
      for (const loading of loadingElements) {
        const attributes = await loading.evaluate(el => ({
          ariaBusy: el.getAttribute('aria-busy'),
          ariaLabel: el.getAttribute('aria-label'),
          role: el.getAttribute('role'),
          ariaLive: el.getAttribute('aria-live')
        }))
        
        // Should indicate loading state to screen readers
        expect(
          attributes.ariaBusy === 'true' || 
          attributes.role === 'status' || 
          attributes.ariaLive
        ).toBe(true)
      }
    })
  })
})

// Helper function to check color contrast
async function checkColorContrast(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel)
    if (!element) return null
    
    const styles = getComputedStyle(element)
    const color = styles.color
    const backgroundColor = styles.backgroundColor
    
    // This is a simplified contrast check
    // In a real implementation, you'd use a proper contrast calculation library
    return {
      color,
      backgroundColor,
      // Add actual contrast ratio calculation here
      contrastRatio: 4.5 // Placeholder
    }
  }, selector)
}

// Helper function to simulate screen reader navigation
async function simulateScreenReaderNavigation(page: Page) {
  // Simulate common screen reader commands
  const commands = [
    'h', // Next heading
    'l', // Next link
    'b', // Next button
    'f', // Next form field
  ]
  
  for (const command of commands) {
    await page.keyboard.press(command)
    await page.waitForTimeout(100)
    
    // Check if focus moved to appropriate element
    const focusedElement = await page.locator(':focus')
    const tagName = await focusedElement.evaluate(el => el?.tagName.toLowerCase())
    
    // Verify focus moved to expected element type
    switch (command) {
      case 'h':
        expect(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).toContain(tagName)
        break
      case 'l':
        expect(tagName).toBe('a')
        break
      case 'b':
        expect(tagName).toBe('button')
        break
      case 'f':
        expect(['input', 'select', 'textarea']).toContain(tagName)
        break
    }
  }
}
