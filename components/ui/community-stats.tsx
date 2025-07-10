'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Link2, TrendingUp, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommunityStatsProps {
  totalSignups?: number;
  maxSignups?: number;
  activeLinks?: number;
  conversionRate?: number;
  recentSignups?: Array<{
    id: string;
    agencyName: string;
    signupDate: string;
    status: 'active' | 'pending' | 'churned';
  }>;
  className?: string;
}

export const CommunityStats = React.forwardRef<HTMLDivElement, CommunityStatsProps>(
  ({ 
    totalSignups = 0,
    maxSignups = 100,
    activeLinks = 0, 
    conversionRate = 0,
    recentSignups = [],
    className 
  }, ref) => {
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString();
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800 border-green-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'churned': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const progressPercentage = (totalSignups / maxSignups) * 100;
    const remaining = maxSignups - totalSignups;
    const isNearingLimit = progressPercentage > 80;

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Community Progress Card */}
        <Card className={cn(
          "border-2",
          isNearingLimit ? "border-orange-200 bg-orange-50/50" : "border-primary/20 bg-primary/5"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Community Growth Progress</CardTitle>
                <CardDescription>
                  {remaining > 0 ? `${remaining} spots remaining` : 'Community link at capacity'}
                </CardDescription>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{totalSignups} agencies joined</span>
              <span className="text-muted-foreground">Goal: {maxSignups}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercentage.toFixed(1)}% complete</span>
              <span>{remaining} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{totalSignups}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Signups</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Link2 className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{activeLinks}</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Links</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{conversionRate.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {recentSignups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Agency Signups</CardTitle>
              <CardDescription>Latest agencies that joined through your community links</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSignups.slice(0, 5).map((signup) => (
                  <div key={signup.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{signup.agencyName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(signup.signupDate)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', getStatusColor(signup.status))}
                    >
                      {signup.status}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {recentSignups.length > 5 && (
                <div className="mt-4 text-center">
                  <button className="text-sm text-primary hover:underline">
                    View all {recentSignups.length} signups
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {recentSignups.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No signups yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your community link to start growing your agency network
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

CommunityStats.displayName = 'CommunityStats';