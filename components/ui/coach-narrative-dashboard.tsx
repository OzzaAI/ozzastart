'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DelightfulButton } from '@/components/ui/delightful-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  ArrowUpRight,
  Users,
  MessageSquare,
  Building2,
  Sparkles,
  Target
} from 'lucide-react';
import Link from 'next/link';

interface CoachData {
  user: { email: string };
  aggregateMetrics: {
    totalRevenue: number;
    totalAgencies: number;
    totalClients: number;
  };
  agencyMetrics: Array<{
    id: string;
    name: string;
    conversionRate: number;
    issueCount: number;
  }>;
}

interface CoachNarrativeDashboardProps {
  coachData: CoachData;
  communityLink?: string;
  onGenerateLink: () => void;
  onShareCelebration?: () => void;
}

export const CoachNarrativeDashboard = React.forwardRef<HTMLDivElement, CoachNarrativeDashboardProps>(
  ({ coachData, communityLink, onGenerateLink, onShareCelebration }, ref) => {
    const currentEarnings = Math.round((coachData?.aggregateMetrics?.totalRevenue || 0) * 0.15);
    const projectedEarnings = Math.round(currentEarnings * 1.25);
    const agencyCount = coachData?.aggregateMetrics?.totalAgencies || 0;
    const clientCount = coachData?.aggregateMetrics?.totalClients || 0;

    return (
      <div ref={ref} className="min-h-screen bg-gradient-to-br from-slate-50/30 via-white to-emerald-50/20">
        {/* FLOW 1: "How am I doing?" - Revenue → Performance → Trend */}
        <div className="relative px-6 pt-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Welcome + Immediate Revenue Answer */}
              <div className="text-center space-y-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  Welcome back, {coachData.user.email.split('@')[0]}
                </h1>
                
                {/* Revenue - The first question they ask themselves */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-emerald-500/10 blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border border-emerald-200/30 rounded-2xl px-6 py-4 shadow-lg shadow-emerald-500/5">
                    <div className="text-xs font-medium text-emerald-700 mb-1">This month's earnings</div>
                    <div className="text-3xl font-bold text-emerald-800">
                      ${currentEarnings.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1 text-emerald-600">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="text-xs font-medium">→ ${projectedEarnings.toLocaleString()} projected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Context - Directly connected to revenue */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-emerald-50/20 rounded-3xl"></div>
                <div className="relative p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Network driving the revenue */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Your Network</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{agencyCount}</div>
                    <div className="text-xs text-slate-500">Active {agencyCount === 1 ? 'Agency' : 'Agencies'}</div>
                  </div>
                  
                  {/* Total revenue source */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">Network Revenue</div>
                    <div className="text-xl font-bold text-slate-800">${(coachData?.aggregateMetrics?.totalRevenue || 0).toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Total Generated</div>
                  </div>
                  
                  {/* Client reach */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Users className="w-3 h-3" />
                      <span className="text-sm font-medium">Reach</span>
                    </div>
                    <div className="text-xl font-bold text-slate-800">{clientCount}</div>
                    <div className="text-xs text-slate-500">Total Clients</div>
                  </div>
                  
                  {/* Growth trend - natural next thought */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-emerald-600">Growth Rate</div>
                    <div className="text-xl font-bold text-emerald-700">+23%</div>
                    <div className="text-xs text-emerald-600">This month</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* FLOW 2: "What needs my attention?" - Problems → Agencies → Action */}
        <div className="px-6 pb-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {/* Attention-requiring items grouped by urgency */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Urgent messages - first attention priority */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <h3 className="text-lg font-medium text-slate-800">Needs Your Input</h3>
                    <Badge variant="destructive" className="text-xs">3 urgent</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { from: 'Digital Marketing Pro', message: 'Client churn issue - need guidance', urgent: true, action: 'advise' },
                      { from: 'Growth Solutions LLC', message: 'Conversion rate optimization question', urgent: false, action: 'guide' },
                      { from: 'Scale Agency', message: 'New funnel template request', urgent: false, action: 'resource' }
                    ].map((msg, i) => (
                      <div key={i} className={cn(
                        "relative p-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.01] cursor-pointer",
                        msg.urgent 
                          ? "bg-gradient-to-r from-red-50 to-orange-50 text-red-800 border border-red-200/50" 
                          : "bg-gradient-to-r from-slate-50/30 to-white text-slate-700"
                      )}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{msg.from}</div>
                            <div className="text-xs opacity-80 mt-1">{msg.message}</div>
                          </div>
                          <div className="text-xs bg-white/50 px-2 py-1 rounded text-slate-600">
                            {msg.action}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Agency performance - connected to messages */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <h3 className="text-lg font-medium text-slate-800">Agency Health</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {coachData?.agencyMetrics?.slice(0, 3).map((agency, i) => {
                      const hasIssues = agency.issueCount > 0;
                      const isLowConversion = agency.conversionRate < 5;
                      return (
                        <div key={agency.id} className={cn(
                          "relative p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer",
                          hasIssues || isLowConversion
                            ? "bg-gradient-to-r from-amber-50/50 to-orange-50/30 border border-amber-200/30"
                            : "bg-gradient-to-r from-emerald-50/30 to-green-50/20"
                        )}>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-slate-700">{agency.name}</div>
                              <div className="text-xs text-slate-600 mt-1">
                                {agency.conversionRate}% conversion
                                {hasIssues && ` • ${agency.issueCount} issues`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasIssues && (
                                <Badge variant="destructive" className="text-xs">
                                  fix
                                </Badge>
                              )}
                              {isLowConversion && (
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                                  optimize
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) || (
                      <div className="text-center py-4 text-slate-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No agencies yet - start building your network below</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Natural Bridge: From problems to opportunities */}
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
                  <span>All good?</span>
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="font-medium">Time to grow</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* FLOW 3: "How can I grow?" - Capacity → Opportunity → Action */}
        <div className="px-6 pb-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {/* Growth opportunity as natural next step */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current capacity - where they are */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <h3 className="text-lg font-medium text-slate-800">Current Capacity</h3>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-slate-50/20 rounded-2xl"></div>
                    <div className="relative p-4 space-y-3">
                      <div className="text-2xl font-bold text-blue-700">{agencyCount}/100</div>
                      <div className="text-sm text-slate-600">Network Slots Used</div>
                      <div className="w-full bg-blue-200/50 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${agencyCount}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Available opportunity - what's possible */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-lg font-medium text-slate-800">Available Growth</h3>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/30 rounded-2xl"></div>
                    <div className="relative p-4 space-y-3">
                      <div className="text-2xl font-bold text-emerald-700">{100 - agencyCount}</div>
                      <div className="text-sm text-slate-600">Open Network Spots</div>
                      <div className="text-xs font-medium text-emerald-700">
                        +${((100 - agencyCount) * 25 * 0.15).toLocaleString()} potential monthly
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action step - what to do next */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-blue-600" />
                    <h3 className="text-lg font-medium text-slate-800">Next Step</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <DelightfulButton
                      onClick={onGenerateLink}
                      className="w-full gap-2"
                      optimistic={true}
                      haptic="medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      {communityLink ? 'Share Your Link' : 'Generate Community Link'}
                    </DelightfulButton>
                    
                    {communityLink && (
                      <div className="text-xs text-center text-slate-600 bg-slate-50 p-2 rounded">
                        Link ready to share with potential agencies
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick growth calculator - probabilistic next interest */}
              <div className="mt-6">
                <div className="text-center mb-4">
                  <h4 className="text-sm font-medium text-slate-700">Quick Growth Calculator</h4>
                  <p className="text-xs text-slate-500">See how each new agency impacts your monthly earnings</p>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  {[{num: 5, earnings: 5 * 25 * 0.15}, {num: 10, earnings: 10 * 25 * 0.15}, {num: 25, earnings: 25 * 25 * 0.15}, {num: 50, earnings: 50 * 25 * 0.15}].map((scenario, i) => (
                    <div key={i} className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-slate-50/20 rounded-xl"></div>
                      <div className="relative p-3 text-center">
                        <div className="text-lg font-bold text-blue-600">+{scenario.num}</div>
                        <div className="text-xs text-slate-600">+${scenario.earnings.toFixed(0)}/mo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        </div>
        
        {/* Navigation helpers - after they've seen everything */}
        <div className="px-6 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/dashboard/coach/messages">
                  <MessageSquare className="w-4 h-4" />
                  All Messages
                </Link>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/dashboard/coach/agencies">
                  <Building2 className="w-4 h-4" />
                  Manage Agencies
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CoachNarrativeDashboard.displayName = 'CoachNarrativeDashboard';