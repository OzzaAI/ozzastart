"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  Puzzle,
  Users,
  Settings,
  DollarSign,
  MessageSquare,
  BarChart3,
  Webhook,
  Code,
  BookOpen,
} from "lucide-react";

interface ConsoleNavigationProps {
  userRole: string;
}

export function ConsoleNavigation({ userRole }: ConsoleNavigationProps) {
  const pathname = usePathname();

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: "Dashboard",
        href: "/console",
        icon: LayoutDashboard,
        description: "Overview and quick actions",
      },
      {
        name: "Workspaces",
        href: "/console/workspaces",
        icon: Zap,
        description: "Manage AI workspaces",
      },
    ];

    // Coach-specific items
    if (userRole === 'coach') {
      return [
        ...baseItems,
        {
          name: "Referrals",
          href: "/console/referrals",
          icon: DollarSign,
          description: "Track referral income",
        },
        {
          name: "Analytics",
          href: "/console/analytics",
          icon: BarChart3,
          description: "Performance metrics",
        },
      ];
    }

    // Agency-specific items
    if (userRole === 'agency') {
      return [
        ...baseItems,
        {
          name: "Clients",
          href: "/console/clients",
          icon: Users,
          description: "Manage client workspaces",
        },
        {
          name: "Automations",
          href: "/console/automations",
          icon: Webhook,
          description: "Automation dashboard",
        },
        {
          name: "MCPs",
          href: "/console/mcps",
          icon: Puzzle,
          description: "Develop integrations",
        },
        {
          name: "Communications",
          href: "/console/communications",
          icon: MessageSquare,
          description: "Client messages",
        },
        {
          name: "Revenue",
          href: "/console/revenue",
          icon: DollarSign,
          description: "Track earnings",
        },
      ];
    }

    // Developer-specific items
    if (userRole === 'developer') {
      return [
        ...baseItems,
        {
          name: "My MCPs",
          href: "/console/my-mcps",
          icon: Code,
          description: "Manage integrations",
        },
        {
          name: "Submissions",
          href: "/console/submissions",
          icon: Puzzle,
          description: "Review status",
        },
        {
          name: "Revenue",
          href: "/console/revenue",
          icon: DollarSign,
          description: "Track MCP earnings",
        },
        {
          name: "Documentation",
          href: "/console/docs",
          icon: BookOpen,
          description: "MCP development docs",
        },
      ];
    }

    // Client/default items
    return [
      ...baseItems,
      {
        name: "Team",
        href: "/console/team",
        icon: Users,
        description: "Manage workspace members",
      },
      {
        name: "Integrations",
        href: "/console/integrations",
        icon: Puzzle,
        description: "Connect your tools",
      },
      {
        name: "Usage",
        href: "/console/usage",
        icon: BarChart3,
        description: "Token usage & billing",
      },
      {
        name: "Settings",
        href: "/console/settings",
        icon: Settings,
        description: "Workspace settings",
      },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/console' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <div>
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="border-t border-gray-200 p-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Link
            href="/console/workspaces/new"
            className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            + New Workspace
          </Link>
          {(userRole === 'agency' || userRole === 'developer') && (
            <Link
              href="/console/mcps/new"
              className="block w-full text-left px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
            >
              + Submit MCP
            </Link>
          )}
          <Link
            href="/"
            className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            → Go to Workspace
          </Link>
        </div>
      </div>
    </nav>
  );
}
