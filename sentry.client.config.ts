import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture Replay for Sessions
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture Replay for Errors
  replaysOnErrorSampleRate: 1.0,
  
  // Filter out PII and sensitive data
  beforeSend(event) {
    // Remove user email and IP
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    
    // Remove sensitive form data
    if (event.request?.data) {
      const data = event.request.data
      if (typeof data === 'object') {
        delete data.password
        delete data.token
        delete data.apiKey
        delete data.secret
        delete data.creditCard
      }
    }
    
    // Remove sensitive URLs
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/([?&])(token|key|secret)=[^&]*/gi, '$1$2=***')
    }
    
    return event
  },
  
  // Configure which integrations to use
  integrations: [
    new Sentry.Replay({
      // Mask all text content, but not attributes
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Don't capture console.log as breadcrumbs in production
  beforeBreadcrumb(breadcrumb) {
    if (process.env.NODE_ENV === 'production' && breadcrumb.category === 'console') {
      return null
    }
    return breadcrumb
  },
})
