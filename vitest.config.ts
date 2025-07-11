/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*', '.next/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        '.next/',
        'public/',
        'examples/',
        'docs/',
        '**/*.test.*',
        '**/*.spec.*',
        'sentry.*.config.ts',
        'next.config.ts',
        'tailwind.config.ts',
        'drizzle.config.ts',
        'middleware.ts' // Exclude middleware from coverage as it's hard to test in isolation
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Specific thresholds for critical modules
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
        },
        'lib/security.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    testTimeout: 15000, // Increased for LLM API calls
    hookTimeout: 10000,
    teardownTimeout: 5000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Retry flaky tests
    retry: 2,
    // Run tests in sequence for integration tests to avoid conflicts
    sequence: {
      concurrent: true
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/lib': resolve(__dirname, './lib'),
      '@/components': resolve(__dirname, './components'),
      '@/app': resolve(__dirname, './app'),
      '@/db': resolve(__dirname, './db'),
      '@/types': resolve(__dirname, './types'),
      '@/hooks': resolve(__dirname, './hooks'),
      '@/tests': resolve(__dirname, './tests')
    }
  },
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.LLM_PROVIDER': '"xai"',
    'process.env.XAI_MODEL_ID': '"grok-4-0709"'
  }
})
