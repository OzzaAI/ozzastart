import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Supported locales for Ozza-Reboot
export const locales = ['en', 'es', 'fr'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Locale configuration with display names and RTL support
export const localeConfig = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr' as const,
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dir: 'ltr' as const,
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dir: 'ltr' as const,
  },
} as const

// Validate locale helper
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

// Get locale display name
export function getLocaleDisplayName(locale: Locale, currentLocale: Locale = 'en'): string {
  const config = localeConfig[locale]
  return currentLocale === locale ? config.nativeName : config.name
}

// Next-intl configuration
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!isValidLocale(locale)) {
    notFound()
  }

  try {
    // Load messages for the current locale
    const messages = (await import(`./locales/${locale}.json`)).default
    
    return {
      messages,
      // Configure time zone and other locale-specific settings
      timeZone: 'UTC',
      now: new Date(),
      // Configure number and date formatting
      formats: {
        dateTime: {
          short: {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          },
          long: {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          },
        },
        number: {
          precise: {
            maximumFractionDigits: 5,
          },
          currency: {
            style: 'currency',
            currency: 'USD',
          },
        },
      },
    }
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error)
    notFound()
  }
})

// Helper to get user's preferred locale from headers
export function getPreferredLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return defaultLocale

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=')
      return { code: code.toLowerCase(), quality: parseFloat(q) }
    })
    .sort((a, b) => b.quality - a.quality)

  // Find first supported locale
  for (const { code } of languages) {
    // Check exact match
    if (isValidLocale(code)) {
      return code
    }
    
    // Check language prefix (e.g., 'en-US' -> 'en')
    const prefix = code.split('-')[0]
    if (isValidLocale(prefix)) {
      return prefix
    }
  }

  return defaultLocale
}

// GDPR-compliant locale detection
export function detectLocaleGDPR(
  acceptLanguage?: string,
  userPreference?: string,
  geoLocation?: string
): Locale {
  // Priority order for GDPR compliance:
  // 1. User's explicit preference (stored in profile/cookies with consent)
  // 2. Accept-Language header
  // 3. Geographic location (only if user consented)
  // 4. Default locale

  if (userPreference && isValidLocale(userPreference)) {
    return userPreference
  }

  if (acceptLanguage) {
    const preferred = getPreferredLocale(acceptLanguage)
    if (preferred !== defaultLocale) {
      return preferred
    }
  }

  // Geographic fallback (only with user consent)
  if (geoLocation) {
    const geoLocaleMap: Record<string, Locale> = {
      'ES': 'es',
      'MX': 'es',
      'AR': 'es',
      'CO': 'es',
      'FR': 'fr',
      'CA': 'fr', // Quebec
      'BE': 'fr', // Belgium (partial)
      'CH': 'fr', // Switzerland (partial)
    }
    
    const geoLocale = geoLocaleMap[geoLocation.toUpperCase()]
    if (geoLocale && isValidLocale(geoLocale)) {
      return geoLocale
    }
  }

  return defaultLocale
}
