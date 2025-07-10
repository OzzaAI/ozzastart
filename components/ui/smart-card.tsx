'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';

interface SmartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'metric' | 'interactive' | 'premium' | 'glass';
  hover?: 'lift' | 'glow' | 'scale' | 'none';
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  interactive?: boolean;
  clickable?: boolean;
  metric?: {
    value: string | number;
    label: string;
    trend?: {
      value: number;
      direction: 'up' | 'down';
      period?: string;
    };
    icon?: React.ReactNode;
    formatter?: (value: number) => string;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  glassmorphism?: boolean;
  blur?: boolean;
  onVisibilityChange?: (isVisible: boolean) => void;
}

const SmartCard = React.forwardRef<HTMLDivElement, SmartCardProps>(
  ({
    className,
    variant = 'default',
    hover = 'lift',
    loading = false,
    success = false,
    error = false,
    interactive = false,
    clickable = false,
    metric,
    badge,
    glassmorphism = false,
    blur = false,
    onVisibilityChange,
    children,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    // Intersection Observer for entrance animations
    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
          onVisibilityChange?.(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );

      if (cardRef.current) {
        observer.observe(cardRef.current);
      }

      return () => observer.disconnect();
    }, [onVisibilityChange]);

    // Variant-specific styles
    const variantStyles = {
      default: 'border bg-card text-card-foreground shadow-sm',
      metric: 'border bg-gradient-to-br from-card to-card/50 text-card-foreground shadow-lg',
      interactive: 'border bg-card text-card-foreground shadow-md cursor-pointer select-none',
      premium: 'border-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm shadow-2xl shadow-purple-500/10',
      glass: 'border border-white/20 bg-white/10 backdrop-blur-md shadow-xl'
    };

    // Hover effect styles - subtle and tasteful
    const hoverStyles = {
      lift: 'hover:shadow-lg hover:-translate-y-0.5',
      glow: 'hover:shadow-xl hover:shadow-primary/15',
      scale: 'hover:scale-[1.01]',
      none: ''
    };

    // State-based styles
    const stateStyles = {
      loading: 'opacity-75 cursor-wait',
      success: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20',
      error: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
      normal: ''
    };

    const currentState = loading ? 'loading' : success ? 'success' : error ? 'error' : 'normal';

    // Entrance animation classes
    const entranceClasses = isVisible 
      ? 'translate-y-0 opacity-100' 
      : 'translate-y-4 opacity-0';

    return (
      <Card
        ref={cardRef}
        className={cn(
          'transition-all duration-300 ease-out transform-gpu will-change-transform',
          variantStyles[variant],
          hoverStyles[hover],
          stateStyles[currentState],
          entranceClasses,
          interactive && 'group',
          clickable && 'cursor-pointer',
          glassmorphism && 'backdrop-blur-md bg-white/10 border-white/20',
          blur && 'backdrop-blur-sm',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Subtle premium accent */}
        {variant === 'premium' && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}

        {/* Badge overlay */}
        {badge && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant={badge.variant}>{badge.text}</Badge>
          </div>
        )}

        {/* Metric card content */}
        {metric ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              {metric.icon && (
                <div className="h-4 w-4 text-muted-foreground">
                  {metric.icon}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof metric.value === 'number' && metric.formatter 
                  ? metric.formatter(metric.value)
                  : metric.value
                }
              </div>
              {metric.trend && (
                <p className={cn(
                  'text-xs flex items-center gap-1 mt-1',
                  metric.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {metric.trend.direction === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(metric.trend.value)}%
                  {metric.trend.period && ` from ${metric.trend.period}`}
                </p>
              )}
            </CardContent>
          </>
        ) : (
          children
        )}

        {/* Interactive overlay */}
        {interactive && (
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Card>
    );
  }
);

SmartCard.displayName = 'SmartCard';

// Specialized card components
export const MetricCard = ({ 
  metric, 
  className, 
  ...props 
}: { metric: SmartCardProps['metric'] } & Omit<SmartCardProps, 'metric'>) => (
  <SmartCard
    variant="metric"
    hover="glow"
    metric={metric}
    className={className}
    {...props}
  />
);

export const InteractiveCard = ({ 
  children, 
  className, 
  onClick,
  ...props 
}: SmartCardProps & { onClick?: () => void }) => (
  <SmartCard
    variant="interactive"
    hover="lift"
    interactive
    clickable
    className={className}
    onClick={onClick}
    {...props}
  >
    {children}
  </SmartCard>
);

export const GlassCard = ({ 
  children, 
  className, 
  ...props 
}: SmartCardProps) => (
  <SmartCard
    variant="glass"
    hover="glow"
    glassmorphism
    className={className}
    {...props}
  >
    {children}
  </SmartCard>
);

export { SmartCard };