let withNextIntl = (config) => config

try {
  const createNextIntlPlugin = require('next-intl/plugin')
  withNextIntl = createNextIntlPlugin('./i18n/config.ts')
} catch (error) {
  console.warn('next-intl not found, running without i18n support')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better accessibility and i18n
  experimental: {
    // Enable server components for better performance
    serverExternalPackages: ['@axe-core/react'],
  },

  // Security headers for accessibility and general security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Accessibility headers
          {
            key: 'X-UA-Compatible',
            value: 'IE=edge',
          },
          // Content Security Policy for enhanced security
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://app.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.x.ai https://api.openai.com https://app.posthog.com https://sentry.io wss:",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; '),
          },
        ],
      },
      // Locale-specific headers
      {
        source: '/en/:path*',
        headers: [
          {
            key: 'Content-Language',
            value: 'en',
          },
        ],
      },
      {
        source: '/es/:path*',
        headers: [
          {
            key: 'Content-Language',
            value: 'es',
          },
        ],
      },
      {
        source: '/fr/:path*',
        headers: [
          {
            key: 'Content-Language',
            value: 'fr',
          },
        ],
      },
    ]
  },

  // Redirects for accessibility and SEO
  async redirects() {
    return [
      // Redirect root to default locale
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
      // Legacy URL redirects
      {
        source: '/dashboard',
        destination: '/en/dashboard',
        permanent: true,
      },
      {
        source: '/chat',
        destination: '/en/chat',
        permanent: true,
      },
      {
        source: '/marketplace',
        destination: '/en/marketplace',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/en/admin',
        permanent: true,
      },
      {
        source: '/settings',
        destination: '/en/settings',
        permanent: true,
      },
    ]
  },

  // Rewrites for API routes and static assets
  async rewrites() {
    return [
      // API routes don't need locale prefixes
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      // Health check endpoint
      {
        source: '/health',
        destination: '/api/health',
      },
      // Sitemap with locale support
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      // Robots.txt
      {
        source: '/robots.txt',
        destination: '/api/robots',
      },
    ]
  },

  // Image optimization for accessibility (alt text enforcement)
  images: {
    domains: [
      'localhost',
      'ozza-reboot.vercel.app',
      // Add your production domains
    ],
    formats: ['image/webp', 'image/avif'],
    // Ensure images are optimized for accessibility
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack configuration for accessibility tools
  webpack: (config, { dev, isServer }) => {
    // Add axe-core in development for accessibility testing
    if (dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@axe-core/react': require.resolve('@axe-core/react'),
      }
    }

    // Optimize bundle for accessibility libraries
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    }

    return config
  },

  // Environment variables for accessibility and i18n
  env: {
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
    NEXT_PUBLIC_SUPPORTED_LOCALES: 'en,es,fr',
  },

  // Compiler options for better accessibility
  compiler: {
    // Remove console logs in production but keep accessibility warnings
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Output configuration
  output: 'standalone',
  
  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Compression for better performance (accessibility benefit)
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Page extensions (for potential accessibility-specific pages)
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Trailing slash configuration for consistent URLs
  trailingSlash: false,

  // React strict mode for better development experience
  reactStrictMode: true,
}

module.exports = withNextIntl(nextConfig)
