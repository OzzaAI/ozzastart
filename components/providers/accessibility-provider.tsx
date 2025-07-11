'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  screenReaderMode: boolean
  keyboardNavigation: boolean
  announcements: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  focusElement: (selector: string) => void
  skipToContent: () => void
  skipToNavigation: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderMode: false,
  keyboardNavigation: true,
  announcements: true,
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null)
  const t = useTranslations('accessibility')

  // Initialize accessibility settings from localStorage and system preferences
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error)
      }
    }

    // Detect system preferences
    const mediaQueries = {
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      largeText: window.matchMedia('(prefers-reduced-data: reduce)'), // Approximation
    }

    const updateFromSystem = () => {
      setSettings(prev => ({
        ...prev,
        highContrast: prev.highContrast || mediaQueries.highContrast.matches,
        reducedMotion: prev.reducedMotion || mediaQueries.reducedMotion.matches,
      }))
    }

    updateFromSystem()

    // Listen for system preference changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updateFromSystem)
    })

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updateFromSystem)
      })
    }
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement
    
    // High contrast mode
    root.classList.toggle('high-contrast', settings.highContrast)
    
    // Large text mode
    root.classList.toggle('large-text', settings.largeText)
    
    // Reduced motion mode
    root.classList.toggle('reduced-motion', settings.reducedMotion)
    
    // Screen reader mode
    root.classList.toggle('screen-reader-mode', settings.screenReaderMode)
    
    // Keyboard navigation mode
    root.classList.toggle('keyboard-navigation', settings.keyboardNavigation)

    // Save settings to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [settings])

  // Set up screen reader announcer
  useEffect(() => {
    const announcerElement = document.getElementById('screen-reader-announcer')
    setAnnouncer(announcerElement)
  }, [])

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Enable keyboard navigation on first tab press
      if (event.key === 'Tab' && !settings.keyboardNavigation) {
        updateSetting('keyboardNavigation', true)
      }

      // Skip links shortcuts
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            skipToContent()
            break
          case '2':
            event.preventDefault()
            skipToNavigation()
            break
          case 'h':
            event.preventDefault()
            focusElement('h1, h2, h3, h4, h5, h6')
            break
          case 'm':
            event.preventDefault()
            focusElement('[role="main"], main')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [settings.keyboardNavigation])

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    // Announce setting changes
    if (settings.announcements) {
      const settingName = t(key as any) || key
      const status = value ? t('enabled') : t('disabled')
      announce(`${settingName} ${status}`, 'polite')
    }
  }

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer || !settings.announcements) return

    // Clear previous announcement
    announcer.textContent = ''
    
    // Set new announcement with slight delay to ensure screen readers pick it up
    setTimeout(() => {
      announcer.textContent = message
      announcer.setAttribute('aria-live', priority)
    }, 100)

    // Clear announcement after a delay
    setTimeout(() => {
      announcer.textContent = ''
    }, 5000)
  }

  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const skipToContent = () => {
    focusElement('#main-content, [role="main"], main')
  }

  const skipToNavigation = () => {
    focusElement('#main-navigation, [role="navigation"], nav')
  }

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    announce,
    focusElement,
    skipToContent,
    skipToNavigation,
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Hook for managing focus
export function useFocusManagement() {
  const { focusElement, announce } = useAccessibility()

  const focusFirst = (container?: HTMLElement) => {
    const root = container || document
    const focusable = root.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (focusable) {
      focusable.focus()
    }
  }

  const focusLast = (container?: HTMLElement) => {
    const root = container || document
    const focusable = Array.from(root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[]
    
    const last = focusable[focusable.length - 1]
    if (last) {
      last.focus()
    }
  }

  const trapFocus = (container: HTMLElement) => {
    const focusable = Array.from(container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[]

    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus first element
    first.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  return {
    focusFirst,
    focusLast,
    trapFocus,
    focusElement,
    announce,
  }
}

// Hook for managing ARIA attributes
export function useAriaAttributes() {
  const { announce } = useAccessibility()

  const setAriaLabel = (element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label)
  }

  const setAriaDescribedBy = (element: HTMLElement, id: string) => {
    element.setAttribute('aria-describedby', id)
  }

  const setAriaExpanded = (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString())
  }

  const setAriaSelected = (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString())
  }

  const setAriaPressed = (element: HTMLElement, pressed: boolean) => {
    element.setAttribute('aria-pressed', pressed.toString())
  }

  const setAriaChecked = (element: HTMLElement, checked: boolean | 'mixed') => {
    element.setAttribute('aria-checked', checked.toString())
  }

  const setAriaDisabled = (element: HTMLElement, disabled: boolean) => {
    element.setAttribute('aria-disabled', disabled.toString())
    if (disabled) {
      element.setAttribute('tabindex', '-1')
    } else {
      element.removeAttribute('tabindex')
    }
  }

  const setAriaHidden = (element: HTMLElement, hidden: boolean) => {
    element.setAttribute('aria-hidden', hidden.toString())
  }

  const setAriaLive = (element: HTMLElement, live: 'off' | 'polite' | 'assertive') => {
    element.setAttribute('aria-live', live)
  }

  const announceStateChange = (element: HTMLElement, state: string) => {
    const label = element.getAttribute('aria-label') || element.textContent || 'Element'
    announce(`${label} ${state}`, 'polite')
  }

  return {
    setAriaLabel,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaSelected,
    setAriaPressed,
    setAriaChecked,
    setAriaDisabled,
    setAriaHidden,
    setAriaLive,
    announceStateChange,
  }
}
