'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { locales, localeConfig, getLocaleDisplayName, type Locale } from '../../i18n/config'
import { useAccessibility, useAriaAttributes } from '../providers/accessibility-provider'
import { Button } from './button'
import { trackEvent } from '../../lib/monitoring'

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'dropdown'
  showFlags?: boolean
  className?: string
}

export function LanguageSwitcher({ 
  variant = 'default', 
  showFlags = true,
  className = '' 
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentLocale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('accessibility')
  
  const { announce } = useAccessibility()
  const { setAriaExpanded } = useAriaAttributes()
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          buttonRef.current?.focus()
          break
        case 'ArrowDown':
          event.preventDefault()
          focusNextOption()
          break
        case 'ArrowUp':
          event.preventDefault()
          focusPreviousOption()
          break
        case 'Home':
          event.preventDefault()
          focusFirstOption()
          break
        case 'End':
          event.preventDefault()
          focusLastOption()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const focusNextOption = () => {
    const options = dropdownRef.current?.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>
    if (!options) return

    const currentIndex = Array.from(options).findIndex(option => option === document.activeElement)
    const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
    options[nextIndex].focus()
  }

  const focusPreviousOption = () => {
    const options = dropdownRef.current?.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>
    if (!options) return

    const currentIndex = Array.from(options).findIndex(option => option === document.activeElement)
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
    options[previousIndex].focus()
  }

  const focusFirstOption = () => {
    const firstOption = dropdownRef.current?.querySelector('[role="option"]') as HTMLElement
    firstOption?.focus()
  }

  const focusLastOption = () => {
    const options = dropdownRef.current?.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>
    const lastOption = options?.[options.length - 1]
    lastOption?.focus()
  }

  const handleLocaleChange = async (newLocale: Locale) => {
    try {
      // Track locale change event
      await trackEvent('locale_changed', {
        from: currentLocale,
        to: newLocale,
        pathname,
        method: 'language_switcher'
      })

      // Store user preference (GDPR compliant)
      localStorage.setItem('user-locale', newLocale)
      document.cookie = `user-locale=${newLocale}; path=/; max-age=31536000; SameSite=Strict`

      // Navigate to new locale
      const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
      router.push(newPathname)

      // Announce change to screen readers
      const newLanguageName = getLocaleDisplayName(newLocale, currentLocale)
      announce(t('changeLanguage', { language: newLanguageName }), 'assertive')

      setIsOpen(false)
    } catch (error) {
      console.error('Failed to change locale:', error)
      announce('Failed to change language', 'assertive')
    }
  }

  const toggleDropdown = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    
    if (buttonRef.current) {
      setAriaExpanded(buttonRef.current, newIsOpen)
    }

    if (newIsOpen) {
      // Focus first option when opening
      setTimeout(() => focusFirstOption(), 100)
    }
  }

  const currentLocaleConfig = localeConfig[currentLocale]

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={toggleDropdown}
          aria-label={t('languageSwitcher')}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="h-8 w-8 p-0"
        >
          {showFlags ? (
            <span className="text-lg" role="img" aria-label={currentLocaleConfig.name}>
              {currentLocaleConfig.flag}
            </span>
          ) : (
            <Globe className="h-4 w-4" />
          )}
        </Button>
        
        {isOpen && (
          <LanguageDropdown
            ref={dropdownRef}
            currentLocale={currentLocale}
            onLocaleChange={handleLocaleChange}
            showFlags={showFlags}
          />
        )}
      </div>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <Button
          ref={buttonRef}
          variant="outline"
          onClick={toggleDropdown}
          aria-label={t('languageSwitcher')}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="justify-between min-w-[120px]"
        >
          <div className="flex items-center gap-2">
            {showFlags && (
              <span className="text-sm" role="img" aria-label={currentLocaleConfig.name}>
                {currentLocaleConfig.flag}
              </span>
            )}
            <span className="text-sm">
              {getLocaleDisplayName(currentLocale, currentLocale)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        
        {isOpen && (
          <LanguageDropdown
            ref={dropdownRef}
            currentLocale={currentLocale}
            onLocaleChange={handleLocaleChange}
            showFlags={showFlags}
          />
        )}
      </div>
    )
  }

  // Default variant - inline buttons
  return (
    <div className={`flex items-center gap-1 ${className}`} role="group" aria-label={t('languageSwitcher')}>
      {locales.map((locale) => {
        const isSelected = locale === currentLocale
        const localeInfo = localeConfig[locale]
        
        return (
          <Button
            key={locale}
            variant={isSelected ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLocaleChange(locale)}
            aria-label={t('changeLanguage', { language: localeInfo.name })}
            aria-pressed={isSelected}
            className="h-8 px-2"
          >
            {showFlags && (
              <span className="text-sm mr-1" role="img" aria-label={localeInfo.name}>
                {localeInfo.flag}
              </span>
            )}
            <span className="text-xs font-medium">
              {locale.toUpperCase()}
            </span>
            {isSelected && <span className="sr-only">{t('currentLanguage', { language: localeInfo.name })}</span>}
          </Button>
        )
      })}
    </div>
  )
}

// Language dropdown component
const LanguageDropdown = React.forwardRef<
  HTMLDivElement,
  {
    currentLocale: Locale
    onLocaleChange: (locale: Locale) => void
    showFlags: boolean
  }
>(({ currentLocale, onLocaleChange, showFlags }, ref) => {
  const t = useTranslations('accessibility')

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-1 shadow-md z-50"
      role="listbox"
      aria-label={t('languageSwitcher')}
    >
      {locales.map((locale) => {
        const isSelected = locale === currentLocale
        const localeInfo = localeConfig[locale]
        
        return (
          <button
            key={locale}
            role="option"
            aria-selected={isSelected}
            onClick={() => onLocaleChange(locale)}
            className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            tabIndex={-1}
          >
            {showFlags && (
              <span className="text-base" role="img" aria-label={localeInfo.name}>
                {localeInfo.flag}
              </span>
            )}
            <div className="flex flex-col items-start">
              <span className="font-medium">{localeInfo.nativeName}</span>
              <span className="text-xs text-muted-foreground">{localeInfo.name}</span>
            </div>
            {isSelected && (
              <Check className="ml-auto h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )
      })}
    </div>
  )
})

LanguageDropdown.displayName = 'LanguageDropdown'
