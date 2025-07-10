'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  DollarSign, 
  BarChart3, 
  Heart, 
  Clock, 
  Smile, 
  Mail, 
  Send, 
  Plus,
  Settings,
  HelpCircle,
  User,
  LogOut,
  Building,
  Target,
  Activity,
  Zap,
  ChevronUp,
  X,
  BookOpen,
  LifeBuoy,
  ArrowUp
} from 'lucide-react';

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isNew?: boolean;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Home',
    href: '/dashboard/coach',
    icon: Home
  },
  {
    label: 'Income',
    href: '/dashboard/coach/income',
    icon: DollarSign,
    children: [
      {
        label: 'Earnings Breakdown',
        href: '/dashboard/coach/income',
        icon: BarChart3
      },
      {
        label: 'Boost Earnings',
        href: '/dashboard/coach/income/boost',
        icon: Zap
      },
      {
        label: 'Products',
        href: '/dashboard/coach/income/products',
        icon: Target
      },
      {
        label: 'Community Analytics',
        href: '/dashboard/coach/income/community-analytics',
        icon: Users
      }
    ]
  },
  {
    label: 'Web App',
    href: '/dashboard/coach/webapp',
    icon: Building,
    children: [
      {
        label: 'Community Management',
        href: '/dashboard/coach/webapp/management',
        icon: Users
      },
      {
        label: 'Settings',
        href: '/dashboard/coach/webapp/settings',
        icon: Settings
      }
    ]
  },
  {
    label: 'Guidance',
    href: '/dashboard/coach/guidance',
    icon: BookOpen,
    children: [
      {
        label: 'Documentation',
        href: '/dashboard/coach/guidance/docs',
        icon: BookOpen
      },
      {
        label: 'Support',
        href: '/dashboard/coach/guidance/support',
        icon: LifeBuoy
      }
    ]
  },
  {
    label: 'Settings',
    href: '/dashboard/coach/settings',
    icon: Settings
  }
];

export default function ModernSidebar({ 
  user, 
  onLogout, 
  isMobileMenuOpen = false, 
  setIsMobileMenuOpen
}: SidebarProps) {
  const pathname = usePathname();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Auto-expand section if current page is in it
  React.useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    navigationItems.forEach(item => {
      if (item.children) {
        const isInSection = pathname.startsWith(item.href) || 
                           item.children.some(child => pathname === child.href);
        newExpanded[item.href] = isInSection;
      }
    });
    setExpandedSections(newExpanded);
  }, [pathname]);

  return (
    <>
      {/* Custom Glass Scrollbar Styles */}
      <style jsx>{`
        .glass-scroll-custom::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        
        .glass-scroll-custom::-webkit-scrollbar-track {
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.1) 0%,
            rgba(0, 0, 0, 0.15) 20%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(0, 0, 0, 0.15) 80%,
            rgba(0, 0, 0, 0.1) 100%
          );
          border-radius: 12px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .glass-scroll-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.4) 25%,
            rgba(0, 0, 0, 0.5) 50%,
            rgba(0, 0, 0, 0.4) 75%,
            rgba(0, 0, 0, 0.3) 100%
          );
          border-radius: 12px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }
        
        .glass-scroll-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.4) 0%,
            rgba(0, 0, 0, 0.5) 25%,
            rgba(0, 0, 0, 0.6) 50%,
            rgba(0, 0, 0, 0.5) 75%,
            rgba(0, 0, 0, 0.4) 100%
          );
          border-color: rgba(255, 255, 255, 0.12);
        }
        
        .glass-scroll-custom::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.5) 0%,
            rgba(0, 0, 0, 0.6) 25%,
            rgba(0, 0, 0, 0.7) 50%,
            rgba(0, 0, 0, 0.6) 75%,
            rgba(0, 0, 0, 0.5) 100%
          );
          border-color: rgba(255, 255, 255, 0.15);
        }
        
        .glass-scroll-custom::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>

      {/* Tailkit Page Sidebar */}
      <aside
        id="page-sidebar"
                                className="fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col p-3 transition-transform duration-300 ease-out dark:text-gray-200 lg:translate-x-0 lg:scale-100"
        aria-label="Main Sidebar Navigation"
      >
        <div className="flex h-full flex-col rounded-lg border-white/10 shadow-sm backdrop-blur-xl shadow-black/30"
          style={{
            background: 'linear-gradient(180deg, hsla(0, 0%, 0%, 1) 0%, hsla(0, 0%, 0%, 1) 9%, hsla(0, 3%, 7%, 1) 26%, hsla(0, 3%, 7%, 1) 40%, hsla(240, 3%, 6%, 1) 84%, hsla(0, 0%, 0%, 1) 98%)'
          }}>
          {/* Sidebar Header */}
          <div className="flex h-16 flex-none items-center justify-between border-b border-white/10 px-4">
            {/* Brand */}
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-2.5 font-semibold tracking-wide text-white hover:text-gray-100"
            >
              <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">O</span></div>
              <span>Ozza</span>
            </Link>

            {/* Close Sidebar on Mobile */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen?.(false)}
                className="group relative inline-flex w-full items-center gap-2 rounded-lg p-2 text-sm leading-5 text-white hover:text-gray-100"
              >
                <span className="absolute inset-0 scale-50 rounded-lg bg-white/10 opacity-0 transition ease-out group-hover:scale-100 group-hover:opacity-100 group-active:scale-105 group-active:bg-white/20" />
                <X className="relative inline-block size-4" />
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex grow flex-col overflow-y-auto glass-scroll-custom">
            <div className="flex h-full flex-col justify-between">
              {/* Navigation */}
              <nav className="flex flex-col gap-0.5 p-4">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || 
                                 (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const isExpanded = expandedSections[item.href] || false;
                  
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen?.(false)}
                        className={`group flex items-center gap-2.5 rounded-lg px-2 text-sm font-semibold ${
                          isActive 
                            ? 'text-white bg-white/15 hover:bg-white/20 backdrop-blur-sm' 
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                        }`}>
                        <item.icon className={`inline-block size-5 flex-none ${
                          isActive 
                            ? 'text-white' 
                            : 'text-gray-400 group-hover:text-gray-200'
                        }`} />
                        <span className="grow py-2">{item.label}</span>
                        {item.children && (
                          <ChevronUp 
                            className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedSections(prev => ({
                                ...prev,
                                [item.href]: !prev[item.href]
                              }));
                            }}
                          />
                        )}
                      </Link>
                      
                      {/* Nested items */}
                      {item.children && isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setIsMobileMenuOpen?.(false)}
                                className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium ${
                                  isChildActive 
                                    ? 'text-white bg-white/10' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                              >
                                <child.icon className="size-4" />
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Upgrade Plan */}
              <div className="flex flex-col gap-0.5 px-4 pb-4">
                <h4 className="mx-2 pt-6 pb-2 text-xs font-medium text-gray-500">
                  Upgrade
                </h4>
                <div className="rounded-lg bg-gradient-to-b from-white/5 via-white/3 to-white/4 px-3 py-4 text-center backdrop-blur-xl border border-white/10 shadow-xl">
                  <h3 className="mb-1.5 inline-flex items-center gap-2 text-sm font-semibold text-gray-400">
                    <Zap className="inline-block size-5 flex-none text-gray-400" />
                    <span>Upgrade to Pro</span>
                  </h3>
                  <p className="mb-4 text-xs text-gray-500">
                    Unlock advanced features and boost your coaching workflow.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="group flex items-center gap-2.5 rounded-lg px-2 text-sm font-semibold text-gray-400 hover:text-gray-200 bg-white/8 backdrop-blur-lg border border-white/10 hover:bg-white/15 hover:border-white/20 py-2 transition-all duration-300"
                  >
                    <ArrowUp className="inline-block size-5 flex-none text-gray-400 group-hover:text-gray-200" />
                    <span className="grow">Upgrade Plan</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          {user && (
            <div className="flex flex-none items-center border-t border-white/10 p-4">
              {/* User Dropdown */}
              <div className="relative w-full">
                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="group relative inline-flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm leading-5 text-gray-300 hover:border-gray-500 hover:text-gray-100"
                  aria-haspopup="true"
                  aria-expanded={userDropdownOpen}
                >
                  <span className="absolute inset-0 scale-75 rounded-lg bg-white/10 opacity-0 transition ease-out group-hover:scale-100 group-hover:opacity-100 group-active:scale-105 group-active:bg-white/20" />
                  <span className="relative inline-flex items-center gap-2">
                    <span className="relative inline-block flex-none">
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 size-3 rounded-full border-2 border-black/20 bg-emerald-500" />
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
                        alt="User Avatar"
                        className="inline-block size-8 rounded-lg"
                      />
                    </span>
                    <span className="flex grow flex-col text-left">
                      <span className="w-36 truncate text-sm font-semibold text-gray-200">
                        {user.name}
                      </span>
                      <span className="w-36 truncate text-xs font-medium text-gray-400 capitalize">
                        {user.role}
                      </span>
                    </span>
                  </span>
                  <ChevronUp className="relative inline-block size-4 flex-none opacity-50" />
                </button>

                {/* Dropdown */}
                {userDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 bottom-full left-0 z-10 mb-1 origin-bottom rounded-lg shadow-xl shadow-gray-500/10 dark:shadow-gray-900"
                  >
                    <div className="divide-y divide-white/10 rounded-lg bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                      <div className="space-y-1 p-2.5">
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="group flex items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-gray-300 hover:bg-white/10"
                        >
                          <User className="inline-block size-4 flex-none text-gray-300 group-hover:text-gray-100" />
                          <span className="grow py-1.5">Profile</span>
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="group flex items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-gray-300 hover:bg-white/10"
                        >
                          <Settings className="inline-block size-4 flex-none text-gray-300 group-hover:text-gray-100" />
                          <span className="grow py-1.5">Settings</span>
                        </Link>
                      </div>
                      <div className="space-y-1 p-2.5">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout?.();
                          }}
                          className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium text-gray-300 hover:bg-white/10"
                        >
                          <LogOut className="inline-block size-4 flex-none text-gray-300 group-hover:text-gray-100" />
                          <span className="grow py-1.5">Sign out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}