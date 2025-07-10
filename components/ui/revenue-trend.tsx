'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RevenueTrendProps {
  currentAmount: number;
  previousAmount?: number;
  period?: string;
  currency?: string;
  className?: string;
  showGraph?: boolean;
}

export const RevenueTrend = React.forwardRef<HTMLDivElement, RevenueTrendProps>(
  ({ 
    currentAmount, 
    previousAmount = 0, 
    period = 'this month',
    currency = 'USD',
    className,
    showGraph = true
  }, ref) => {
    const percentageChange = previousAmount > 0 
      ? ((currentAmount - previousAmount) / previousAmount) * 100 
      : currentAmount > 0 ? 100 : 0;
    
    const isPositive = percentageChange >= 0;
    const isZero = percentageChange === 0;

    // Simple sparkline data for visual trend
    const generateSparklineData = () => {
      const baseValue = previousAmount || currentAmount * 0.8;
      const steps = 8;
      const data = [];
      
      for (let i = 0; i < steps; i++) {
        const progress = i / (steps - 1);
        const value = baseValue + (currentAmount - baseValue) * progress;
        // Add some realistic variance
        const variance = (Math.random() - 0.5) * (currentAmount * 0.1);
        data.push(Math.max(0, value + variance));
      }
      
      return data;
    };

    const sparklineData = generateSparklineData();
    const maxValue = Math.max(...sparklineData);

    const formatCurrency = (amount: number) => {
      if (currency === 'USD') {
        return `$${amount.toLocaleString()}`;
      }
      return `${amount.toLocaleString()} ${currency}`;
    };

    const formatPercentage = (value: number) => {
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    return (
      <div ref={ref} className={cn('space-y-3', className)}>
        {/* Main Amount */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(currentAmount)}
          </span>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              Revenue Share
            </span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-4">
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            isZero ? 'text-muted-foreground' :
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {!isZero && (isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            ))}
            <span>
              {isZero ? 'No change' : formatPercentage(percentageChange)} {period}
            </span>
          </div>
          
          {previousAmount > 0 && (
            <span className="text-xs text-muted-foreground">
              from {formatCurrency(previousAmount)}
            </span>
          )}
        </div>

        {/* Simple Sparkline */}
        {showGraph && sparklineData.length > 0 && (
          <div className="flex items-end gap-0.5 h-12 mt-4">
            {sparklineData.map((value, index) => {
              const height = (value / maxValue) * 100;
              const isLast = index === sparklineData.length - 1;
              
              return (
                <div
                  key={index}
                  className={cn(
                    'flex-1 rounded-t-sm transition-all duration-200',
                    isLast 
                      ? 'bg-green-500 dark:bg-green-400' 
                      : 'bg-green-200 dark:bg-green-700'
                  )}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
              );
            })}
          </div>
        )}

        {/* Additional Context */}
        <div className="text-xs text-muted-foreground">
          Based on agency subscription revenue
        </div>
      </div>
    );
  }
);

RevenueTrend.displayName = 'RevenueTrend';

export default RevenueTrend;