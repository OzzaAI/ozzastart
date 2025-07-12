import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Ozza-Reboot',
    default: 'Ozza-Reboot',
  },
  description: 'AI-powered SaaS dashboard with Grok 4 integration, coach mode, and marketplace features.',
  keywords: ['AI', 'SaaS', 'Dashboard', 'Grok 4', 'Marketplace', 'Coach Mode'],
  authors: [{ name: 'Ozza-Reboot Team' }],
  creator: 'Ozza-Reboot',
  publisher: 'Ozza-Reboot',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Ozza-Reboot',
    title: 'Ozza-Reboot',
    description: 'AI-powered SaaS dashboard with Grok 4 integration',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ozza-Reboot Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ozza-Reboot',
    description: 'AI-powered SaaS dashboard with Grok 4 integration',
    images: ['/images/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className="font-sans"
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical resources */}
        
        {/* Accessibility meta tags */}
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        
        {/* Viewport with accessibility considerations */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" 
        />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://api.x.ai" />
        <link rel="preconnect" href="https://api.openai.com" />
      </head>
      <body 
        className="min-h-screen bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="ozza-theme"
        >
          {/* Skip links for keyboard navigation */}
          <div className="skip-links">
            <a
              href="#main-content"
              className="skip-link"
            >
              Skip to main content
            </a>
            <a
              href="#main-navigation"
              className="skip-link"
            >
              Skip to navigation
            </a>
          </div>
          
          {/* Screen reader announcements */}
          <div
            id="screen-reader-announcer"
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
            role="status"
          />
          
          {/* Main application content */}
          <div id="app-root" className="relative">
            {children}
          </div>
          
          {/* Toast notifications with accessibility support */}
          <Toaster
            position="top-right"
            expand={true}
            richColors
            closeButton
            toastOptions={{
              duration: 5000,
              className: 'toast-accessible',
              ariaProps: {
                role: 'status',
                'aria-live': 'polite',
              },
            }}
          />
        </ThemeProvider>
        
        {/* Analytics and monitoring scripts */}
        {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}', {
                  api_host: 'https://app.posthog.com',
                  person_profiles: 'identified_only',
                  locale: 'en',
                  capture_pageview: false,
                  capture_pageleave: true,
                  session_recording: {
                    maskAllInputs: true,
                    maskInputOptions: {
                      password: true,
                      email: true,
                    }
                  }
                });
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
