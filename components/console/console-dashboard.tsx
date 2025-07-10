"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  Users,
  Puzzle,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";

interface ConsoleDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ConsoleDashboard({ user }: ConsoleDashboardProps) {
  // Mock data for now - this would come from API calls
  const workspaces: any[] = [];
  const userMCPs: any[] = [];
  const stats = {
    totalWorkspaces: 0,
    activeWorkspaces: 0,
    totalMCPs: 0,
    approvedMCPs: 0,
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    return `${greeting}, ${user.name.split(' ')[0]}!`;
  };

  const getQuickActions = () => {
    switch (user.role) {
      case 'coach':
        return [
          { label: "View Referrals", href: "/console/referrals", icon: DollarSign },
          { label: "Analytics", href: "/console/analytics", icon: TrendingUp },
        ];
      case 'agency':
        return [
          { label: "New Workspace", href: "/console/workspaces/new", icon: Plus },
          { label: "Submit MCP", href: "/console/mcps/new", icon: Puzzle },
          { label: "View Clients", href: "/console/clients", icon: Users },
        ];
      case 'developer':
        return [
          { label: "Submit MCP", href: "/console/mcps/new", icon: Plus },
          { label: "View Revenue", href: "/console/revenue", icon: DollarSign },
          { label: "Documentation", href: "/console/docs", icon: Puzzle },
        ];
      default:
        return [
          { label: "New Workspace", href: "/console/workspaces/new", icon: Plus },
          { label: "Add Integration", href: "/console/integrations", icon: Puzzle },
          { label: "Invite Team", href: "/console/team", icon: Users },
        ];
    }
  };

  const getStatsCards = () => {
    const baseCards = [
      {
        title: "Active Workspaces",
        value: stats.activeWorkspaces,
        total: stats.totalWorkspaces,
        icon: Zap,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
    ];

    if (user.role === 'developer' || user.role === 'agency') {
      baseCards.push({
        title: "Approved MCPs",
        value: stats.approvedMCPs,
        total: stats.totalMCPs,
        icon: Puzzle,
        color: "text-green-600",
        bgColor: "bg-green-50",
      });
    }

    if (user.role === 'coach') {
      baseCards.push(
        {
          title: "Referred Agencies",
          value: 12, // This would come from actual data
          total: 15,
          icon: Users,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        },
        {
          title: "Monthly Revenue",
          value: 2840, // This would come from actual data
          total: 3000,
          icon: DollarSign,
          color: "text-green-600",
          bgColor: "bg-green-50",
        }
      );
    }

    return baseCards;
  };

  const quickActions = getQuickActions();
  const statsCards = getStatsCards();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your {user.role === 'coach' ? 'referrals' : 'workspaces'} today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="px-3 py-1">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account
          </Badge>
          <Button asChild>
            <Link href="/">
              Go to Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    {card.total && (
                      <p className="text-sm text-gray-500">/ {card.total}</p>
                    )}
                  </div>
                  {card.total && (
                    <Progress 
                      value={(card.value / card.total) * 100} 
                      className="mt-3 h-2"
                    />
                  )}
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks for your account type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Workspaces */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Recent Workspaces
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/console/workspaces">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workspaces.length > 0 ? (
              <div className="space-y-3">
                {workspaces.slice(0, 3).map((workspace) => (
                  <div key={workspace.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{workspace.name}</p>
                      <p className="text-xs text-gray-500">
                        {workspace.subscription_tier} • {workspace.member_role}
                      </p>
                    </div>
                    <Badge 
                      variant={workspace.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {workspace.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Zap className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No workspaces yet</p>
                <Button size="sm" className="mt-3" asChild>
                  <Link href="/console/workspaces/new">Create Your First Workspace</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent MCPs or Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                {(user.role === 'developer' || user.role === 'agency') ? (
                  <>
                    <Puzzle className="mr-2 h-5 w-5" />
                    My MCPs
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-5 w-5" />
                    Recent Activity
                  </>
                )}
              </div>
              {(user.role === 'developer' || user.role === 'agency') && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/console/mcps">View All</Link>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(user.role === 'developer' || user.role === 'agency') && userMCPs.length > 0 ? (
              <div className="space-y-3">
                {userMCPs.slice(0, 3).map((mcp) => (
                  <div key={mcp.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{mcp.name}</p>
                      <p className="text-xs text-gray-500">{mcp.category}</p>
                    </div>
                    <Badge 
                      variant={
                        mcp.review_status === 'approved' ? 'default' :
                        mcp.review_status === 'pending' ? 'secondary' :
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {mcp.review_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                {(user.role === 'developer' || user.role === 'agency') ? (
                  <>
                    <Puzzle className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">No MCPs yet</p>
                    <Button size="sm" className="mt-3" asChild>
                      <Link href="/console/mcps/new">Submit Your First MCP</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">No recent activity</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
