'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DelightfulButton } from '@/components/ui/delightful-button';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Link from 'next/link';

interface InsightCardData {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
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

interface ExpandableInsightsProps {
  cards: InsightCardData[];
  className?: string;
}

export const ExpandableInsights = React.forwardRef<HTMLDivElement, ExpandableInsightsProps>(
  ({ cards, className }, ref) => {
    const [expandedCard, setExpandedCard] = React.useState<string | null>(null);
    const [focusedCard, setFocusedCard] = React.useState<string | null>(null);

    const getCardSize = (card: InsightCardData, isExpanded: boolean, isFocused: boolean) => {
      if (isExpanded) return 'md:col-span-4';
      if (isFocused) return 'md:col-span-2';
      
      // Revenue gets premium real estate (Stan principle: visual hierarchy)
      if (card.id === 'revenue') return 'md:col-span-3 col-span-2';
      
      switch (card.priority) {
        case 'high': return 'md:col-span-2 col-span-2';
        case 'medium': return 'md:col-span-1 col-span-1';
        case 'low': return 'md:col-span-1 col-span-1';
        default: return 'md:col-span-1 col-span-1';
      }
    };

    const getThemeClasses = (theme?: string, isExpanded?: boolean, isFocused?: boolean) => {
      // Intentional elevation system: each state has purpose
      const elevationClasses = isExpanded 
        ? 'shadow-2xl ring-4 ring-offset-4 scale-[1.02] z-20' // Commanding presence
        : isFocused 
        ? 'shadow-xl ring-2 ring-offset-2 scale-[1.01] z-10' // Gentle lift
        : 'shadow-sm hover:shadow-lg hover:scale-[1.005] transition-all duration-300'; // Breathing life
      
      // Intentional: No gradients = cleaner, more focused, less visual noise
      // Each color temperature chosen for psychological response
      switch (theme) {
        case 'revenue':
          // Warm green = growth, prosperity, safety - highest saturation for importance
          return `${elevationClasses} border-emerald-200/60 bg-emerald-50/90 backdrop-blur-sm ${(isExpanded || isFocused) ? 'ring-emerald-300/50 border-emerald-300' : 'hover:border-emerald-300/80'}`;
        case 'community':
          // Cool blue = trust, expansion, possibility - medium saturation
          return `${elevationClasses} border-blue-200/60 bg-blue-50/80 backdrop-blur-sm ${(isExpanded || isFocused) ? 'ring-blue-300/50 border-blue-300' : 'hover:border-blue-300/80'}`;
        case 'agencies':
          // Purple = wisdom, management, sophistication - subtle presence
          return `${elevationClasses} border-violet-200/50 bg-violet-50/70 backdrop-blur-sm ${(isExpanded || isFocused) ? 'ring-violet-300/40 border-violet-300' : 'hover:border-violet-300/70'}`;
        case 'activity':
          // Warm orange = urgency, attention, energy - for messages/alerts
          return `${elevationClasses} border-amber-200/60 bg-amber-50/80 backdrop-blur-sm ${(isExpanded || isFocused) ? 'ring-amber-300/50 border-amber-300' : 'hover:border-amber-300/80'}`;
        default:
          // Neutral = calm, professional, secondary importance
          return `${elevationClasses} border-slate-200/50 bg-slate-50/60 backdrop-blur-sm ${(isExpanded || isFocused) ? 'ring-slate-300/40 border-slate-300' : 'hover:border-slate-300/70'}`;
      }
    };

    const toggleExpand = (cardId: string) => {
      setExpandedCard(prev => prev === cardId ? null : cardId);
      setFocusedCard(null);
    };

    const toggleFocus = (cardId: string) => {
      setFocusedCard(prev => prev === cardId ? null : cardId);
      setExpandedCard(null);
    };

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Grid container - responsive and adaptive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-min">
          {cards.map((card) => {
            const isExpanded = expandedCard === card.id;
            const isFocused = focusedCard === card.id;
            const showDetailed = isExpanded || isFocused;
            
            return (
              <Card
                key={card.id}
                className={cn(
                  'transition-all duration-500 ease-out cursor-pointer',
                  getCardSize(card, isExpanded, isFocused),
                  getThemeClasses(card.theme, isExpanded, isFocused)
                )}
                onClick={() => !isExpanded && !isFocused ? toggleFocus(card.id) : undefined}
              >
                <CardHeader className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className={cn(
                            'transition-all duration-300 truncate',
                            showDetailed ? 'text-lg' : 'text-base'
                          )}>
                            {card.title}
                          </CardTitle>
                          {card.priority === 'high' && !showDetailed && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">Priority</Badge>
                          )}
                        </div>
                        <CardDescription className={cn(
                          'transition-all duration-300 line-clamp-2',
                          showDetailed ? 'text-sm' : 'text-xs'
                        )}>
                          {card.description}
                        </CardDescription>
                      </div>
                      
                      {/* Expand/Focus controls */}
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFocus(card.id);
                          }}
                          className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                        >
                          {isFocused ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                        </Button>
                        
                        {card.expandedContent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(card.id);
                            }}
                            className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Primary metric - prominent display */}
                    {card.metrics && (
                      <div className="flex items-end justify-between">
                        <div>
                          <div className={cn(
                            'font-bold transition-all duration-300',
                            showDetailed ? 'text-2xl' : card.priority === 'high' ? 'text-xl' : 'text-lg'
                          )}>
                            {card.metrics.primary.value}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {card.metrics.primary.label}
                          </div>
                        </div>
                        {card.metrics.primary.trend && (
                          <div className="text-green-500">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 pb-3">
                  {/* Compact content - always visible */}
                  <div className="space-y-3">
                    {card.compactContent}
                    
                    {/* Secondary metrics when focused */}
                    {isFocused && card.metrics?.secondary && (
                      <div className="grid grid-cols-2 gap-2">
                        {card.metrics.secondary.map((metric, index) => (
                          <div key={index} className="text-center p-2 bg-background/60 rounded text-sm">
                            <div className="font-semibold">{metric.value}</div>
                            <div className="text-xs text-muted-foreground">{metric.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Expanded content - detailed view */}
                    {isExpanded && card.expandedContent && (
                      <div className="space-y-4 pt-3 border-t">
                        {card.expandedContent}
                      </div>
                    )}
                    
                    {/* CTA - only when expanded/focused */}
                    {card.cta && showDetailed && (
                      <div className="flex justify-center pt-2">
                        {card.cta.variant === 'delightful' ? (
                          <DelightfulButton 
                            onClick={card.cta.action}
                            className="gap-2 w-full"
                            optimistic={true}
                            haptic="medium"
                            celebration={false}
                          >
                            {card.cta.text}
                          </DelightfulButton>
                        ) : card.cta.href ? (
                          <Button asChild variant={card.cta.variant || 'default'} className="w-full">
                            <Link href={card.cta.href}>{card.cta.text}</Link>
                          </Button>
                        ) : (
                          <Button 
                            variant={card.cta.variant || 'default'}
                            onClick={card.cta.action}
                            className="w-full"
                          >
                            {card.cta.text}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
);

ExpandableInsights.displayName = 'ExpandableInsights';