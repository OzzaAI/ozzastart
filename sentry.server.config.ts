import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Filter out PII and sensitive data
  beforeSend(event) {
    // Remove user email and IP
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    
    // Remove sensitive request data
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
    
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.authorization
      delete event.request.headers.cookie
      delete event.request.headers['x-api-key']
    }
    
    return event
  },
  
  // Configure server-specific integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  // Don't capture certain errors in production
  beforeSendTransaction(event) {
    // Filter out health check and monitoring requests
    if (event.transaction?.includes('/health') || 
        event.transaction?.includes('/metrics') ||
        event.transaction?.includes('/_next/static')) {
      return null
    }
    return event
  },
})
