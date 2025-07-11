'use client'

import { useTranslations } from 'next-intl'
import { useAccessibility } from '../providers/accessibility-provider'

export function SkipLinks() {
  const t = useTranslations('accessibility')
  const { skipToContent, skipToNavigation, focusElement } = useAccessibility()

  const handleSkipToContent = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    skipToContent()
  }

  const handleSkipToNavigation = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    skipToNavigation()
  }

  const handleSkipToSearch = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    focusElement('#search-input, [role="search"] input, input[type="search"]')
  }

  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="skip-link"
        onClick={handleSkipToContent}
        onKeyDown={(e) => e.key === 'Enter' && handleSkipToContent(e)}
      >
        {t('skipToContent')}
      </a>
      <a
        href="#main-navigation"
        className="skip-link"
        onClick={handleSkipToNavigation}
        onKeyDown={(e) => e.key === 'Enter' && handleSkipToNavigation(e)}
      >
        {t('skipToNavigation')}
      </a>
      <a
        href="#search"
        className="skip-link"
        onClick={handleSkipToSearch}
        onKeyDown={(e) => e.key === 'Enter' && handleSkipToSearch(e)}
      >
        {t('search')}
      </a>
      
      <style jsx>{`
        .skip-links {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
        }
        
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          padding: 8px 12px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          transition: top 0.2s ease-in-out;
          border: 2px solid transparent;
        }
        
        .skip-link:focus,
        .skip-link:focus-visible {
          top: 6px;
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        
        .skip-link:hover {
          background: hsl(var(--primary) / 0.9);
        }
        
        .skip-link:active {
          background: hsl(var(--primary) / 0.8);
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          .skip-link {
            background: #000000;
            color: #ffffff;
            border: 2px solid #ffffff;
          }
          
          .skip-link:focus {
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
          }
        }
        
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .skip-link {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}
