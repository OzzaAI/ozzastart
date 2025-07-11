import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale, detectLocaleGDPR } from './i18n/config'

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always show locale in URL (/en/dashboard)
  localeDetection: false, // We'll handle detection manually for GDPR compliance
})

// Routes that don't need locale prefixes (API routes, static files, etc.)
const publicRoutes = [
  '/api',
  '/health',
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
  '/_next',
  '/images',
  '/icons',
  '/manifest.json',
]

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/chat',
  '/marketplace',
  '/admin',
  '/settings',
  '/profile',
]

// Admin-only routes
const adminRoutes = [
  '/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Handle locale detection and routing
  const response = await handleLocaleRouting(request)
  if (response) return response

  // Handle authentication and authorization
  return handleAuthAndAuth(request)
}

async function handleLocaleRouting(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  
  // Check if pathname already has a locale
  const hasLocale = locales.some(locale => 
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If no locale in pathname, detect and redirect
  if (!hasLocale && pathname !== '/') {
    const preferredLocale = detectUserLocale(request)
    
    // Redirect to localized version
    const url = request.nextUrl.clone()
    url.pathname = `/${preferredLocale}${pathname}`
    
    // Track locale detection for analytics
    const response = NextResponse.redirect(url)
    response.headers.set('X-Locale-Detected', preferredLocale)
    response.headers.set('X-Locale-Source', 'auto-detect')
    
    return response
  }

  // Apply next-intl middleware for localized routes
  if (hasLocale) {
    return intlMiddleware(request)
  }

  return null
}

function detectUserLocale(request: NextRequest): string {
  // Get user preferences from various sources
  const acceptLanguage = request.headers.get('accept-language') || undefined
  const userPreference = request.cookies.get('user-locale')?.value
  const geoLocation = request.headers.get('cf-ipcountry') || 
                     request.headers.get('x-vercel-ip-country') ||
                     request.geo?.country

  // GDPR-compliant locale detection
  const detectedLocale = detectLocaleGDPR(
    acceptLanguage,
    userPreference,
    geoLocation || undefined
  )

  return detectedLocale
}

async function handleAuthAndAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  
  // Extract locale from pathname
  const locale = locales.find(loc => pathname.startsWith(`/${loc}/`)) || defaultLocale
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'

  // Check if route requires authentication
  const requiresAuth = protectedRoutes.some(route => 
    pathWithoutLocale.startsWith(route)
  )

  // Check if route requires admin access
  const requiresAdmin = adminRoutes.some(route => 
    pathWithoutLocale.startsWith(route)
  )

  if (requiresAuth) {
    // Check authentication status
    const authToken = request.cookies.get('auth-token')?.value ||
                     request.headers.get('authorization')?.replace('Bearer ', '')

    if (!authToken) {
      // Redirect to login with return URL
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}/auth/signin`
      url.searchParams.set('returnUrl', pathname)
      
      const response = NextResponse.redirect(url)
      response.headers.set('X-Auth-Required', 'true')
      return response
    }

    // For admin routes, check admin privileges
    if (requiresAdmin) {
      // In a real implementation, you'd verify the token and check user role
      // For now, we'll assume the token contains role information
      const isAdmin = await checkAdminRole(authToken)
      
      if (!isAdmin) {
        // Redirect to unauthorized page
        const url = request.nextUrl.clone()
        url.pathname = `/${locale}/unauthorized`
        
        const response = NextResponse.redirect(url)
        response.headers.set('X-Admin-Required', 'true')
        return response
      }
    }
  }

  // Add security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // CSP header for enhanced security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.x.ai https://api.openai.com https://api.posthog.com https://sentry.io;"
  )

  // Accessibility headers
  response.headers.set('X-UA-Compatible', 'IE=edge')
  response.headers.set('X-Locale', locale)
  
  return response
}

async function checkAdminRole(token: string): Promise<boolean> {
  // In a real implementation, you would:
  // 1. Verify the JWT token
  // 2. Extract user information
  // 3. Check user role in database
  // 4. Return true if user has admin role
  
  try {
    // Placeholder implementation
    // Replace with actual token verification logic
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin'
  } catch {
    return false
  }
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

function checkRateLimit(ip: string, limit: number = 100, window: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now - record.timestamp > window) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     * - images, icons (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|icons|manifest.json).*)',
  ],
}
