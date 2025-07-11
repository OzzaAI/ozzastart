# Monitoring & Analytics Setup Guide

## Overview

This guide covers the setup and configuration of comprehensive monitoring for Ozza-Reboot, including error tracking with Sentry, user analytics with PostHog, and admin logging dashboard.

## 🚀 Quick Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_public_sentry_dsn_here

# PostHog Configuration  
POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Optional: Custom hosts for self-hosted instances
# POSTHOG_HOST=https://your-posthog-instance.com
# NEXT_PUBLIC_POSTHOG_HOST=https://your-posthog-instance.com
```

### 2. Database Migration

Run the database migration to create monitoring tables:

```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

### 3. Install Dependencies

The required dependencies are already included in `package.json`:

```bash
pnpm install
```

## 📊 Features

### Error Tracking (Sentry)
- **Automatic Error Capture**: Unhandled errors and exceptions
- **Performance Monitoring**: API response times and database queries
- **User Context**: Error tracking with user information (PII-filtered)
- **Custom Error Boundaries**: React error boundaries for UI errors
- **Release Tracking**: Deploy-based error tracking

### User Analytics (PostHog)
- **Event Tracking**: Custom business events (chat sessions, marketplace activity)
- **User Journey**: Complete user flow tracking
- **Feature Flags**: A/B testing and feature rollouts
- **Session Recordings**: User interaction recordings (privacy-compliant)
- **Cohort Analysis**: User segmentation and retention

### Admin Dashboard
- **Security Logs**: Real-time security event monitoring
- **Chat Analytics**: Session statistics and user engagement
- **Performance Metrics**: System performance monitoring
- **Export Functionality**: CSV export for compliance and analysis
- **Real-time Updates**: Live dashboard with 30-second refresh

## 🔧 Configuration

### Sentry Setup

1. **Create Sentry Project**:
   - Go to [sentry.io](https://sentry.io)
   - Create a new Next.js project
   - Copy the DSN from project settings

2. **Configure Sentry**:
   ```typescript
   // sentry.client.config.ts and sentry.server.config.ts are already configured
   // with PII filtering and performance monitoring
   ```

3. **Custom Error Tracking**:
   ```typescript
   import { captureError } from '@/lib/monitoring'
   
   try {
     // Your code here
   } catch (error) {
     captureError(error as Error, { 
       context: 'user_action',
       userId: 'user123' 
     }, 'user123')
   }
   ```

### PostHog Setup

1. **Create PostHog Project**:
   - Go to [posthog.com](https://posthog.com) or your self-hosted instance
   - Create a new project
   - Copy the project API key

2. **Track Custom Events**:
   ```typescript
   import { useEventTracking } from '@/components/providers/monitoring-provider'
   
   const { trackAgentChat, trackMarketplaceShare } = useEventTracking()
   
   // Track agent chat
   trackAgentChat('agent-id', 'session-id')
   
   // Track marketplace activity
   trackMarketplaceShare('agent-id', 'My AI Agent')
   ```

3. **Server-side Tracking**:
   ```typescript
   import { trackEvent } from '@/lib/monitoring'
   
   await trackEvent('subscription_upgraded', {
     fromPlan: 'free',
     toPlan: 'pro',
     revenue: 29.00
   }, userId)
   ```

## 📈 Event Types

### Security Events
- `security_login_attempt` - User login attempts
- `security_login_success` - Successful logins
- `security_login_failed` - Failed login attempts
- `security_2fa_enabled` - 2FA activation
- `rate_limit_exceeded` - Rate limit violations
- `unauthorized_access` - Unauthorized access attempts
- `admin_access_granted` - Admin panel access

### Business Events
- `agent_chat_started` - Chat session initiated
- `agent_chat_completed` - Chat session completed
- `agent_chat_failed` - Chat session errors
- `marketplace_share` - Agent shared to marketplace
- `marketplace_download` - Agent downloaded from marketplace
- `coach_onboarding_started` - Coach onboarding flow
- `subscription_upgraded` - Plan upgrades
- `tool_execution` - AI tool usage

### Performance Events
- `api_response_time` - API endpoint performance
- `database_query_time` - Database query performance
- `tool_execution_time` - AI tool execution time

## 🛡️ Security & Privacy

### PII Protection
- **Email Masking**: Email addresses are masked in logs
- **IP Hashing**: IP addresses are hashed for privacy
- **Data Filtering**: Sensitive data filtered before sending to external services
- **User Consent**: Analytics tracking respects user preferences

### Data Retention
- **Security Logs**: 90 days retention
- **Analytics Data**: 2 years retention (configurable)
- **Error Logs**: 30 days retention
- **Performance Metrics**: 30 days retention

## 🔍 Admin Dashboard

### Access Control
- **Admin Role Required**: Only users with `admin` role can access
- **Audit Logging**: All admin actions are logged
- **IP Restrictions**: Optional IP-based access control

### Features
- **Real-time Monitoring**: Live security event feed
- **Advanced Filtering**: Filter by event type, severity, date range
- **Export Functionality**: CSV export for compliance
- **Analytics Dashboard**: Chat session and user engagement metrics
- **Performance Monitoring**: System health and response times

### Usage
1. Navigate to `/dashboard/admin/logs`
2. Use filters to narrow down events
3. Export data for analysis
4. Monitor real-time security events

## 🚨 Alerting

### Sentry Alerts
- **Error Rate Spikes**: Alert when error rate exceeds threshold
- **Performance Degradation**: Alert on slow API responses
- **New Error Types**: Alert on new error patterns

### Custom Alerts
```typescript
import { checkAndAlertOverages } from '@/lib/monitoring'

// Check for usage overages
await checkAndAlertOverages(userId)
```

### Webhook Integration
Configure webhooks for external alerting systems:
- Slack notifications
- Email alerts
- PagerDuty integration

## 📊 Analytics Queries

### PostHog Insights
1. **User Retention**: Track user return rates
2. **Feature Adoption**: Monitor new feature usage
3. **Conversion Funnels**: Analyze signup to paid conversion
4. **Cohort Analysis**: User behavior over time

### Custom Dashboards
Create custom dashboards for:
- Coach performance metrics
- Agent marketplace analytics
- Revenue attribution
- User engagement scores

## 🔧 Troubleshooting

### Common Issues

1. **Events Not Appearing**:
   - Check environment variables
   - Verify API keys
   - Check browser console for errors

2. **Sentry Not Capturing Errors**:
   - Verify DSN configuration
   - Check error filtering rules
   - Ensure Sentry is initialized

3. **PostHog Events Missing**:
   - Check project API key
   - Verify host configuration
   - Check network connectivity

### Debug Mode
Enable debug mode for troubleshooting:

```env
NODE_ENV=development
```

This will enable:
- Console logging for all events
- Detailed error messages
- PostHog debug mode

## 📚 Best Practices

### Event Naming
- Use consistent naming conventions
- Include context in event names
- Avoid PII in event names

### Error Handling
- Always provide context with errors
- Use structured error data
- Implement proper error boundaries

### Performance
- Sample high-volume events
- Use async tracking where possible
- Implement proper caching

### Privacy
- Always filter PII before tracking
- Respect user privacy preferences
- Implement proper data retention

## 🔄 Maintenance

### Regular Tasks
- Review and clean up old logs
- Update alert thresholds
- Monitor storage usage
- Review security events

### Updates
- Keep Sentry SDK updated
- Update PostHog client
- Review new features and integrations

## 📞 Support

For issues with monitoring setup:
1. Check the troubleshooting section
2. Review environment variables
3. Check service status pages
4. Contact support with specific error messages

## 🎯 Next Steps

After setup:
1. Configure custom dashboards
2. Set up alerting rules
3. Train team on admin dashboard
4. Implement custom event tracking
5. Set up automated reports
