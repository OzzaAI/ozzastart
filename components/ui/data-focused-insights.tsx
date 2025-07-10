'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DelightfulButton } from '@/components/ui/delightful-button';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';

interface DataInsightProps {
  id: string;
  title: string;
  description: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  compactContent: React.ReactNode;
  expandedContent?: React.ReactNode;
  cta?: {
    text: string;
    action?: () => void;
    href?: string;
    variant?: 'default' | 'outline' | 'delightful';
  };
  theme?: 'revenue' | 'community' | 'agencies' | 'activity';
  metrics?: {
    primary: { value: string | number; label: string; trend?: 'up' | 'down' | 'neutral' };
    secondary?: { value: string | number; label: string }[];
  };
}

interface DataFocusedInsightsProps {
  insights: DataInsightProps[];
  className?: string;
}

export const DataFocusedInsights = React.forwardRef<HTMLDivElement, DataFocusedInsightsProps>(
  ({ insights, className }, ref) => {
    const [expandedInsight, setExpandedInsight] = React.useState<string | null>(null);

    // Intentional: Sections blend into background, data pops forward
    const getSectionClasses = (theme?: string, priority?: string) => {
      // Background blending - barely visible containers
      const baseBlend = 'bg-white/20 backdrop-blur-sm border-0';
      
      // Data emphasis through typography and color, not containers
      const priorityClasses = priority === 'primary' 
        ? 'ring-1 ring-black/5' // Subtle definition for primary data
        : 'ring-0'; // Secondary data floats freely
      
      // Theme affects DATA color, not container color
      return `${baseBlend} ${priorityClasses} transition-all duration-500`;
    };

    // Psychology: Data gets visual hierarchy, containers fade (Attention & Cognitive Load)
    const getDataClasses = (theme?: string, priority?: string) => {
      // Luxury car principle: Right-sized elements, not overwhelming
      const priorityScale = priority === 'primary' 
        ? 'text-2xl' // Clear but not overwhelming (proportional to screen)
        : priority === 'secondary' 
        ? 'text-lg' // Readable supporting information
        : 'text-base'; // Comfortable tertiary details
      
      // Psychology: Color temperature affects emotional response
      switch (theme) {
        case 'revenue':
          // Warm green = growth, prosperity, safety (highest emotional weight)
          return `${priorityScale} font-bold text-emerald-700 dark:text-emerald-400 tracking-tight`;
        case 'community':
          // Cool blue = trust, expansion, possibility (medium emotional weight)
          return `${priorityScale} font-semibold text-blue-700 dark:text-blue-400 tracking-normal`;
        case 'agencies':
          // Purple = wisdom, sophistication (lower emotional weight)
          return `${priorityScale} font-medium text-violet-700 dark:text-violet-400`;
        case 'activity':
          // Orange = urgency, attention (alerts and notifications)
          return `${priorityScale} font-medium text-amber-700 dark:text-amber-400`;
        default:
          return `${priorityScale} font-medium text-slate-700 dark:text-slate-400`;
      }
    };

    const getLabelClasses = (priority?: string) => {
      return priority === 'primary' 
        ? 'text-sm font-medium text-slate-600 dark:text-slate-400'
        : 'text-xs font-normal text-slate-500 dark:text-slate-500';
    };

    const toggleExpand = (insightId: string) => {
      setExpandedInsight(prev => prev === insightId ? null : insightId);
    };

    return (
      <div ref={ref} className={cn('space-y-16', className)}>
        {/* Luxury car principle: Breathing room, felt not seen */}
        <div className="space-y-24">
          {insights.map((insight, index) => {
            const isExpanded = expandedInsight === insight.id;
            const isPrimary = insight.priority === 'primary';
            
            return (
              <section
                key={insight.id}
                className={cn(
                  // Luxury car principle: Almost invisible container
                  'transition-all duration-700 relative',
                  // No visible borders - separation through content design
                  isPrimary ? 'py-4' : 'py-2',
                  // Subtle hover states - felt interaction
                  'hover:bg-gradient-to-b hover:from-white/5 hover:to-transparent'
                )}
                style={{
                  // Stan principle: Gradient separation felt in the data element itself
                  background: isPrimary && insight.theme === 'revenue' 
                    ? 'linear-gradient(to bottom, rgba(16, 185, 129, 0.02) 0%, transparent 70%)'
                    : undefined
                }}
              >
                {/* Psychology: Gestalt Proximity - Related info grouped together */}
                <div className="flex items-start justify-between mb-6">
                  {/* Primary data cluster - psychology: immediate recognition */}
                  <div className="space-y-4">
                    {/* Title fades to background, data comes forward */}
                    <h3 className={cn(
                      'transition-all duration-300',
                      isPrimary ? 'text-lg font-medium text-slate-700' : 'text-base font-normal text-slate-600',
                      'dark:text-slate-300'
                    )}>
                      {insight.title}
                    </h3>
                    
                    {/* Psychology: Primary metric dominates visually (Attention Theory) */}
                    {insight.metrics && (
                      <div className="flex items-end gap-6">
                        {/* Main metric - psychology: single point of focus */}
                        <div className="space-y-1">
                          <div className={getDataClasses(insight.theme, insight.priority)}>
                            {insight.metrics.primary.value}
                          </div>
                          <div className={getLabelClasses(insight.priority)}>
                            {insight.metrics.primary.label}
                          </div>
                        </div>
                        
                        {/* Psychology: Trend creates emotional context (Peak-End Rule) */}
                        {insight.metrics.primary.trend && (
                          <div className={cn(
                            'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium',
                            'shadow-sm border transition-all duration-200',
                            insight.metrics.primary.trend === 'up' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                          )}>
                            {insight.metrics.primary.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {insight.metrics.primary.trend === 'up' ? 'Growing' : 'Declining'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expand control - minimal, purpose-driven */}
                  {insight.expandedContent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(insight.id)}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {/* Stan principle: Secondary metrics with subtle gradient separation */}
                {insight.metrics?.secondary && (
                  <div className="relative mb-8">
                    {/* Luxury car principle: Gradient creates separation from within */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent pointer-events-none opacity-40"></div>
                    <div className="grid grid-cols-3 gap-6 py-4 relative">
                      {insight.metrics.secondary.map((metric, index) => (
                        <div key={index} className="text-center">
                          <div className="text-base font-semibold text-slate-700 dark:text-slate-300">
                            {metric.value}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compact content - blends seamlessly */}
                <div className="mb-6">
                  {insight.compactContent}
                </div>

                {/* Expanded content - smooth revelation */}
                {isExpanded && insight.expandedContent && (
                  <div className="border-t border-slate-200/50 pt-6 mb-6 animate-in fade-in duration-500">
                    {insight.expandedContent}
                  </div>
                )}

                {/* CTA - action-focused, not decoration */}
                {insight.cta && (isPrimary || isExpanded) && (
                  <div className="flex justify-start">
                    {insight.cta.variant === 'delightful' ? (
                      <DelightfulButton 
                        onClick={insight.cta.action}
                        className="gap-2"
                        optimistic={true}
                        haptic="medium"
                        celebration={false}
                      >
                        {insight.cta.text}
                      </DelightfulButton>
                    ) : insight.cta.href ? (
                      <Button asChild variant={insight.cta.variant || 'default'}>
                        <Link href={insight.cta.href}>{insight.cta.text}</Link>
                      </Button>
                    ) : (
                      <Button 
                        variant={insight.cta.variant || 'default'}
                        onClick={insight.cta.action}
                      >
                        {insight.cta.text}
                      </Button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    );
  }
);

DataFocusedInsights.displayName = 'DataFocusedInsights';