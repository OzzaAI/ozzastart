'use client'

import { useTranslations } from 'next-intl'

export function ScreenReaderAnnouncements() {
  const t = useTranslations('accessibility')

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        id="screen-reader-announcer"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
      
      {/* Assertive announcer for urgent messages */}
      <div
        id="screen-reader-announcer-assertive"
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
      />
      
      {/* Page structure announcements */}
      <div className="sr-only">
        <h1>{t('mainContent')}</h1>
        <p>
          {t('navigation')} - {t('skipToNavigation')}
        </p>
        <p>
          {t('search')} - Alt + S
        </p>
        <p>
          Keyboard shortcuts: Alt + 1 for main content, Alt + 2 for navigation, Alt + H for headings
        </p>
      </div>
      
      <style jsx>{`
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
      `}</style>
    </>
  )
}
