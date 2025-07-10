'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import ModernSidebar from './ModernSidebar';
import ModernHeader from './ModernHeader';
import OnboardingChecklist from './OnboardingChecklist';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
    plan?: string;
  };
  onLogout?: () => void;
  showOnboarding?: boolean;
  onboardingItems?: any[];
  notifications?: Array<{
    id: string;
    type: 'message' | 'system' | 'update';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
  }>;
}

export default function DashboardLayout({
  children,
  user,
  onLogout,
  showOnboarding = false,
  onboardingItems = [],
  notifications = []
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [showOnboardingChecklist, setShowOnboardingChecklist] = useState(showOnboarding);
  const [onboardingCollapsed, setOnboardingCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOnboardingItemComplete = (itemId: string) => {
    console.log('Onboarding item completed:', itemId);
    // Here you would typically update the item's completion status in your backend
  };

  const handleOnboardingDismiss = () => {
    setShowOnboardingChecklist(false);
    // Save user preference to not show onboarding again
    localStorage.setItem('onboarding-dismissed', 'true');
  };

  return (
    <>
      {/* Tailkit Page Container - exact structure */}
      <div
        id="page-container"
        className="mx-auto flex min-h-dvh w-full min-w-80 flex-col lg:pl-72 dark:text-gray-100 bg-[linear-gradient(90deg,hsla(0,0%,0%,1)_0%,hsla(0,0%,0%,1)_81%,hsla(220,35%,8%,1)_100%)]"
      >
        {/* Page overlay when mobile sidebar is open */}
        <div
          aria-hidden="true"
          tabIndex={-1}
          className={`fixed inset-0 z-40 bg-gray-100/50 p-4 backdrop-blur-xs lg:hidden lg:p-8 dark:bg-gray-900/75 ${
            isMobileMenuOpen ? '' : 'hidden'
          }`}
        />
        {/* Tailkit Page Sidebar */}
        <ModernSidebar
          user={user}
          onLogout={onLogout}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Tailkit Page Content */}
        <main id="page-content" className="flex max-w-full flex-auto flex-col">
          <div className="mx-auto w-full max-w-10xl pt-3 px-4 lg:px-8 pb-4 lg:pb-8">
            {children}
          </div>
        </main>

        {/* Onboarding Checklist - positioned as overlay */}
        {showOnboardingChecklist && user && (
          <OnboardingChecklist
            userRole={user.role as 'coach' | 'agency' | 'client'}
            items={onboardingItems}
            onItemComplete={handleOnboardingItemComplete}
            onDismiss={handleOnboardingDismiss}
            isCollapsed={onboardingCollapsed}
            onToggleCollapse={() => setOnboardingCollapsed(!onboardingCollapsed)}
          />
        )}
      </div>
    </>
  );
}
  