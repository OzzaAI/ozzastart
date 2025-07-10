'use client';

import React, { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  ChevronDown,
  User,
  LogOut,
  CreditCard,
  HelpCircle,
  Mail,
  MessageSquare,
  Calendar,
  Zap,
  Crown,
  Star,
  Menu
} from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
    plan?: string;
  };
  onLogout?: () => void;
  notifications?: Array<{
    id: string;
    type: 'message' | 'system' | 'update';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
  }>;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const quickActions = [
  { label: 'New Project', icon: Plus, href: '/dashboard/projects/new', shortcut: '⌘N' },
  { label: 'Add Client', icon: User, href: '/dashboard/clients/new', shortcut: '⌘U' },
  { label: 'Schedule Meeting', icon: Calendar, href: '/dashboard/appointments/new', shortcut: '⌘M' },
  { label: 'Send Message', icon: MessageSquare, href: '/dashboard/messages/new', shortcut: '⌘T' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ModernHeader({ 
  user, 
  onLogout, 
  notifications = [], 
  isMobileMenuOpen = false, 
  setIsMobileMenuOpen 
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'system':
        return <Bell className="w-4 h-4" />;
      case 'update':
        return <Zap className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'pro':
      case 'premium':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'enterprise':
        return <Star className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <header
      id="page-header"
      className="fixed top-0 right-0 left-0 z-30 flex h-16 flex-none items-center bg-gray-100/90 backdrop-blur-xs lg:pl-72 dark:bg-gray-900/90"
    >
      <div className="container mx-auto flex w-full justify-between px-4 lg:px-8 xl:max-w-7xl">
        {/* Left Section */}
        <div className="flex flex-none items-center gap-4">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 font-bold tracking-wide text-gray-900 hover:text-gray-600 lg:hidden dark:text-gray-100 dark:hover:text-gray-300"
          >
            <img 
              className="w-8 h-8" 
              src="/ozza-logo.svg" 
              alt="Ozza"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span class="text-white font-bold text-lg">O</span></div>';
              }}
            />
            <span>Ozza</span>
          </Link>

        </div>

        {/* Right Section */}
        <div className="flex flex-none items-center gap-3">
          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Invite Agency */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Invite Agency</span>
            </button>

            {/* View Analytics */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Star className="w-4 h-4" />
              <span className="hidden lg:inline">Analytics</span>
            </button>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="group relative inline-flex w-full items-center gap-2 rounded-lg p-2 text-sm leading-5 text-gray-800 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <span className="absolute inset-0 scale-50 rounded-lg bg-gray-200/75 opacity-0 transition ease-out group-hover:scale-100 group-hover:opacity-100 group-active:scale-105 group-active:bg-gray-200 dark:bg-gray-700/50 dark:group-active:bg-gray-700/75" />
            <span className="relative inline-block">
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 size-3 rounded-full border border-white bg-emerald-500" />
              )}
              <Bell className="inline-block size-5" />
            </span>
          </button>

          {/* Toggle Sidebar on Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen?.(!isMobileMenuOpen)}
            className="group relative inline-flex w-full items-center gap-2 rounded-lg p-2 text-sm leading-5 text-gray-800 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:text-white"
          >
            <span className="absolute inset-0 scale-50 rounded-lg bg-gray-200/75 opacity-0 transition ease-out group-hover:scale-100 group-hover:opacity-100 group-active:scale-105 group-active:bg-gray-200 dark:bg-gray-700/50 dark:group-active:bg-gray-700/75" />
            <Menu className="relative inline-block size-5 rotate-180" />
          </button>
        </div>
      </div>
    </header>
  );
}