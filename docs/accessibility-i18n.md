# Accessibility & Internationalization Guide

## Overview

This guide covers the comprehensive accessibility (a11y) and internationalization (i18n) implementation for Ozza-Reboot, ensuring WCAG 2.1 AA compliance and multi-language support for global reach.

## 🎯 Accessibility Standards

### WCAG 2.1 AA Compliance

Our implementation meets or exceeds WCAG 2.1 AA standards across four key principles:

1. **Perceivable** - Information must be presentable in ways users can perceive
2. **Operable** - Interface components must be operable by all users
3. **Understandable** - Information and UI operation must be understandable
4. **Robust** - Content must be robust enough for various assistive technologies

### Key Features Implemented

- ✅ **Color Contrast**: 4.5:1 minimum ratio for normal text, 3:1 for large text
- ✅ **Keyboard Navigation**: Full keyboard accessibility with visible focus indicators
- ✅ **Screen Reader Support**: Comprehensive ARIA labels and semantic HTML
- ✅ **Alternative Text**: Descriptive alt text for all images and icons
- ✅ **Focus Management**: Proper focus trapping in modals and complex components
- ✅ **Skip Links**: Quick navigation for keyboard and screen reader users
- ✅ **Responsive Design**: Accessible across all device sizes and orientations
- ✅ **High Contrast Mode**: Support for users with visual impairments
- ✅ **Reduced Motion**: Respects user's motion preferences

## 🌍 Internationalization (i18n)

### Supported Languages

- **English (en)** - Default language
- **Spanish (es)** - Full translation support
- **French (fr)** - Full translation support

### Technical Implementation

- **Framework**: next-intl for Next.js App Router
- **Routing**: Locale-based routing (`/en/dashboard`, `/es/dashboard`, `/fr/dashboard`)
- **Auto-detection**: GDPR-compliant locale detection from headers and preferences
- **Fallback**: Graceful fallback to English for missing translations

## 🏗️ Architecture

### File Structure

```
i18n/
├── config.ts                 # i18n configuration and locale detection
├── locales/
│   ├── en.json               # English translations
│   ├── es.json               # Spanish translations
│   └── fr.json               # French translations
components/
├── providers/
│   └── accessibility-provider.tsx  # Accessibility state management
├── accessibility/
│   ├── skip-links.tsx        # Keyboard navigation shortcuts
│   └── screen-reader-announcements.tsx  # Live regions
└── ui/
    ├── button.tsx            # Accessible button component
    └── language-switcher.tsx # Locale selection component
middleware.ts                 # Locale routing and detection
```

### Key Components

#### AccessibilityProvider
Manages global accessibility state and provides utilities:

```typescript
const { 
  settings,           // Current accessibility preferences
  updateSetting,      // Update accessibility settings
  announce,           // Screen reader announcements
  focusElement,       // Programmatic focus management
  skipToContent,      // Skip to main content
  skipToNavigation    // Skip to navigation
} = useAccessibility()
```

#### Language Switcher
Provides accessible language selection:

```typescript
<LanguageSwitcher 
  variant="dropdown"    // default | compact | dropdown
  showFlags={true}      // Show country flags
  className="..."       // Custom styling
/>
```

## 🎨 Design System Integration

### Color Contrast

All color combinations meet WCAG AA standards:

```css
/* Primary colors - 4.5:1 contrast ratio */
--primary: #0f172a;
--primary-foreground: #ffffff;

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --background: #000000;
    --foreground: #ffffff;
    --primary: #ffffff;
    --primary-foreground: #000000;
  }
}
```

### Typography

Accessible typography with proper sizing and spacing:

```css
/* Base font size for readability */
html { font-size: 16px; }

/* Large text option */
.large-text {
  font-size: 1.25rem;
  line-height: 1.6;
}

/* Focus indicators */
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Motion and Animation

Respects user preferences for reduced motion:

```css
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
```

## 🔧 Implementation Guide

### Setting Up i18n

1. **Install Dependencies**
```bash
pnpm add next-intl
```

2. **Configure Middleware**
```typescript
// middleware.ts
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
})

export default intlMiddleware
```

3. **Update Layout**
```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function Layout({ 
  children, 
  params: { locale } 
}) {
  const messages = await getMessages()
  
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Adding Translations

1. **Define Keys in JSON**
```json
// i18n/locales/en.json
{
  "navigation": {
    "dashboard": "Dashboard",
    "chat": "Chat",
    "marketplace": "Marketplace"
  },
  "coach": {
    "metrics": "Metrics",
    "revenue": "Revenue",
    "conversion": "Conversion Rate"
  }
}
```

2. **Use in Components**
```typescript
import { useTranslations } from 'next-intl'

export function CoachMetrics() {
  const t = useTranslations('coach')
  
  return (
    <div>
      <h2>{t('metrics')}</h2>
      <div>{t('revenue')}: $12,500</div>
    </div>
  )
}
```

### Implementing Accessibility

1. **Use Semantic HTML**
```typescript
// Good: Semantic structure
<main id="main-content">
  <h1>Dashboard</h1>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
    </ul>
  </nav>
</main>
```

2. **Add ARIA Labels**
```typescript
<Button
  ariaLabel="Close dialog"
  ariaExpanded={isOpen}
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</Button>
```

3. **Manage Focus**
```typescript
import { useFocusManagement } from '../providers/accessibility-provider'

export function Modal({ isOpen, onClose }) {
  const { trapFocus } = useFocusManagement()
  const modalRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current)
      return cleanup
    }
  }, [isOpen, trapFocus])
  
  return (
    <div 
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal content */}
    </div>
  )
}
```

## 🧪 Testing

### Automated Testing

We use comprehensive automated testing for accessibility:

```bash
# Run accessibility tests
pnpm exec playwright test --project=accessibility-chrome

# Run i18n tests
pnpm exec playwright test --project=i18n-spanish --project=i18n-french

# Run all accessibility and i18n tests
pnpm test:accessibility
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Skip links work correctly
- [ ] Focus is visible and logical
- [ ] No keyboard traps (except modals)
- [ ] All functionality available via keyboard

#### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS)
- [ ] All content is announced correctly
- [ ] Proper heading structure (h1-h6)
- [ ] Form labels are associated correctly

#### Visual Testing
- [ ] 4.5:1 color contrast for normal text
- [ ] 3:1 color contrast for large text
- [ ] High contrast mode works
- [ ] Text scales to 200% without horizontal scrolling
- [ ] Focus indicators are visible

#### Internationalization Testing
- [ ] All text is translated correctly
- [ ] Date/time formats are localized
- [ ] Number formats respect locale
- [ ] Currency displays correctly
- [ ] RTL languages work (if supported)

### Testing Tools

#### Automated Tools
- **axe-core**: Accessibility testing engine
- **Playwright**: E2E testing with accessibility checks
- **ESLint jsx-a11y**: Static analysis for accessibility

#### Manual Testing Tools
- **WAVE**: Web accessibility evaluation
- **axe DevTools**: Browser extension for accessibility testing
- **Lighthouse**: Performance and accessibility auditing
- **Color Contrast Analyzers**: WCAG contrast checking

## 🚀 Deployment

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,es,fr

# Analytics with locale tracking
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### CDN Configuration

Ensure proper locale-based caching:

```javascript
// next.config.js
module.exports = {
  i18n: {
    locales: ['en', 'es', 'fr'],
    defaultLocale: 'en',
  },
  headers: async () => [
    {
      source: '/:locale*',
      headers: [
        {
          key: 'Content-Language',
          value: ':locale',
        },
      ],
    },
  ],
}
```

## 📊 Monitoring and Analytics

### Accessibility Monitoring

Track accessibility metrics in production:

```typescript
// Track accessibility feature usage
await trackEvent('accessibility_feature_used', {
  feature: 'high_contrast_mode',
  enabled: true,
  userId: user.id
})

// Monitor screen reader usage
await trackEvent('screen_reader_detected', {
  screenReader: 'NVDA',
  version: '2023.1',
  userId: user.id
})
```

### i18n Analytics

Monitor language preferences and usage:

```typescript
// Track locale changes
await trackEvent('locale_changed', {
  from: 'en',
  to: 'es',
  method: 'language_switcher',
  userId: user.id
})

// Monitor translation coverage
await trackEvent('translation_missing', {
  key: 'coach.newMetric',
  locale: 'es',
  fallback: 'en'
})
```

## 🔄 Maintenance

### Regular Tasks

1. **Weekly**
   - Run accessibility tests
   - Check for new translation keys
   - Review user feedback

2. **Monthly**
   - Update translation files
   - Audit color contrast
   - Test with latest screen readers

3. **Quarterly**
   - Full accessibility audit
   - User testing with disabled users
   - Review and update documentation

### Adding New Languages

1. **Create Translation File**
```bash
# Copy English template
cp i18n/locales/en.json i18n/locales/de.json
```

2. **Update Configuration**
```typescript
// i18n/config.ts
export const locales = ['en', 'es', 'fr', 'de'] as const

export const localeConfig = {
  // ... existing locales
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr' as const,
  },
}
```

3. **Add to Middleware**
```typescript
// middleware.ts - automatically picks up new locales from config
```

4. **Test New Language**
```bash
pnpm exec playwright test --project=i18n-german
```

## 🆘 Troubleshooting

### Common Issues

#### Screen Reader Not Announcing Changes
```typescript
// Solution: Use live regions
const { announce } = useAccessibility()
announce('Content updated', 'polite')
```

#### Focus Not Visible
```css
/* Solution: Ensure focus styles are defined */
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

#### Translation Keys Missing
```typescript
// Solution: Add fallback handling
const t = useTranslations('coach')
const text = t('newKey', { fallback: 'Default text' })
```

#### Locale Not Detected
```typescript
// Solution: Check middleware configuration
// Ensure locales are properly configured in i18n/config.ts
```

### Getting Help

1. **Internal Resources**
   - Check this documentation
   - Review test files for examples
   - Consult component implementations

2. **External Resources**
   - [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
   - [next-intl Documentation](https://next-intl-docs.vercel.app/)
   - [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

3. **Community Support**
   - WebAIM Community
   - A11y Slack Community
   - Next.js Discord

## 📈 Success Metrics

### Accessibility KPIs
- WCAG 2.1 AA compliance: 100%
- Keyboard navigation coverage: 100%
- Screen reader compatibility: 95%+
- Color contrast compliance: 100%
- User satisfaction (disabled users): 4.5/5

### i18n KPIs
- Translation coverage: 95%+
- Locale detection accuracy: 98%+
- Page load time impact: <100ms
- User engagement (non-English): +25%
- Global user satisfaction: 4.6/5

---

This comprehensive implementation ensures Ozza-Reboot is accessible to all users and ready for global deployment with full internationalization support.
