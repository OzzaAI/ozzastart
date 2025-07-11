import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
    ['github'] // GitHub Actions integration
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    // Global test timeout
    timeout: 60000,
    // Locale for testing
    locale: 'en-US',
    // Timezone for consistent testing
    timezoneId: 'UTC',
    // Extra HTTP headers for i18n testing
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools Protocol for performance monitoring
        launchOptions: {
          args: [
            '--enable-chrome-browser-cloud-management',
            '--enable-accessibility-logging',
            '--enable-logging=stderr',
            '--vmodule=accessibility*=1',
          ]
        }
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Tablet testing
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
    // High DPI testing
    {
      name: 'Desktop Chrome HiDPI',
      use: { 
        ...devices['Desktop Chrome HiDPI'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Accessibility-specific test configurations
    {
      name: 'accessibility-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // High contrast mode testing
        colorScheme: 'dark',
        reducedMotion: 'reduce',
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--enable-accessibility-logging',
            '--enable-logging=stderr',
            '--vmodule=accessibility*=1',
            '--force-color-profile=srgb',
            '--enable-features=ForcedColors',
          ],
        },
      },
      testMatch: '**/accessibility.spec.ts',
    },

    {
      name: 'accessibility-firefox',
      use: {
        ...devices['Desktop Firefox'],
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      },
      testMatch: '**/accessibility.spec.ts',
    },

    // Internationalization testing
    {
      name: 'i18n-spanish',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'es-ES',
        extraHTTPHeaders: {
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
      },
      testMatch: '**/i18n.spec.ts',
    },

    {
      name: 'i18n-french',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'fr-FR',
        extraHTTPHeaders: {
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      },
      testMatch: '**/i18n.spec.ts',
    },

    // Performance testing configuration
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        // Enable performance metrics
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-logging=stderr',
            '--log-level=0',
          ],
        },
      },
      testMatch: '**/performance.spec.ts',
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Test environment variables
      NODE_ENV: 'test',
      LLM_PROVIDER: 'xai',
      XAI_MODEL_ID: 'grok-4-0709',
      XAI_API_KEY: 'test-xai-key',
      OPENAI_API_KEY: 'test-openai-key',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      BETTER_AUTH_SECRET: 'test-secret-key-for-e2e-testing-only',
      SENTRY_DSN: 'https://test@sentry.io/test',
      POSTHOG_KEY: 'test-posthog-key',
      UPSTASH_REDIS_REST_URL: 'http://localhost:6379',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
      NEXT_PUBLIC_DEFAULT_LOCALE: 'en'
    }
  },
  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
  // Test-specific configuration
  expect: {
    // Increase timeout for assertions
    timeout: 10000,
    // Custom matchers
    toHaveScreenshot: { 
      threshold: 0.2,
      mode: 'strict'
    }
  },
  // Output directories
  outputDir: 'test-results/e2e-artifacts',
  // Metadata
  metadata: {
    'test-suite': 'Ozza-Reboot E2E Tests',
    'grok-4': 'enabled',
    'monitoring': 'sentry+posthog',
    'features': 'chat,marketplace,admin-logs,coach-mode',
    'accessibility-standard': 'WCAG 2.1 AA',
    'i18n-locales': 'en, es, fr',
  }
})
