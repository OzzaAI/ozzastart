import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { locales, localeConfig, type Locale } from '../i18n/config'
import { AccessibilityProvider } from '../components/providers/accessibility-provider'
import { SkipLinks } from '../components/accessibility/skip-links'
import { ScreenReaderAnnouncements } from '../components/accessibility/screen-reader-announcements'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as Locale
  const messages = await getMessages()
  
  return {
    title: {
      template: `%s | ${messages.navigation?.dashboard || 'Ozza-Reboot'}`,
      default: messages.navigation?.dashboard || 'Ozza-Reboot',
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
    alternates: {
      canonical: '/',
      languages: Object.fromEntries(
        locales.map(loc => [loc, `/${loc}`])
      ),
    },
    openGraph: {
      type: 'website',
      locale: locale,
      alternateLocale: locales.filter(loc => loc !== locale),
      siteName: 'Ozza-Reboot',
      title: messages.navigation?.dashboard || 'Ozza-Reboot',
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
      title: messages.navigation?.dashboard || 'Ozza-Reboot',
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
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

interface RootLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()
  const localeInfo = localeConfig[locale as Locale]

  return (
    <html 
      lang={locale} 
      dir={localeInfo.dir}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* Accessibility meta tags */}
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        
        {/* Viewport with accessibility considerations */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" 
        />
        
        {/* Language alternatives */}
        {locales.map(loc => (
          <link
            key={loc}
            rel="alternate"
            hrefLang={loc}
            href={`/${loc}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`/${locale}`} />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://api.x.ai" />
        <link rel="preconnect" href="https://api.openai.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body 
        className={`
          ${inter.className} 
          min-h-screen 
          bg-background 
          font-sans 
          antialiased
          selection:bg-primary/20
          selection:text-primary-foreground
        `}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="ozza-theme"
          >
            <AccessibilityProvider>
              {/* Skip links for keyboard navigation */}
              <SkipLinks />
              
              {/* Screen reader announcements */}
              <ScreenReaderAnnouncements />
              
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
              
              {/* Development accessibility tools */}
              {process.env.NODE_ENV === 'development' && (
                <AccessibilityDevTools />
              )}
            </AccessibilityProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        
        {/* Analytics and monitoring scripts */}
        <MonitoringScripts locale={locale} />
      </body>
    </html>
  )
}

// Accessibility development tools component
function AccessibilityDevTools() {
  if (typeof window === 'undefined') return null
  
  // Only load in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@axe-core/react').then((axe) => {
        axe.default(React, ReactDOM, 1000)
      })
    }
  }, [])
  
  return null
}

// Monitoring and analytics scripts
function MonitoringScripts({ locale }: { locale: string }) {
  return (
    <>
      {/* PostHog Analytics */}
      {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}', {
                api_host: 'https://app.posthog.com',
                person_profiles: 'identified_only',
                locale: '${locale}',
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
      
      {/* Sentry Error Tracking */}
      {process.env.NEXT_PUBLIC_SENTRY_DSN && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (window.Sentry) {
                  window.Sentry.captureException(e.error, {
                    tags: {
                      locale: '${locale}',
                      component: 'global-error-handler'
                    }
                  });
                }
              });
            `,
          }}
        />
      )}
    </>
  )
}

// CSS for accessibility improvements
const accessibilityStyles = `
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :root {
      --background: #000000;
      --foreground: #ffffff;
      --primary: #ffffff;
      --primary-foreground: #000000;
      --border: #ffffff;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  
  /* Focus visible improvements */
  :focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  /* Skip links styling */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
    font-weight: 600;
  }
  
  .skip-link:focus {
    top: 6px;
  }
  
  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Toast accessibility improvements */
  .toast-accessible {
    border: 1px solid hsl(var(--border));
  }
  
  .toast-accessible:focus-within {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }
`
