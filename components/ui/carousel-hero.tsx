'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DelightfulButton } from '@/components/ui/delightful-button';
import { RevenueTrend } from '@/components/ui/revenue-trend';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  Building, 
  Activity, 
  BarChart3, 
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface CarouselCardData {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  cta?: {
    text: string;
    action?: () => void;
    href?: string;
    variant?: 'default' | 'outline' | 'delightful';
  };
  theme?: 'revenue' | 'community' | 'agencies' | 'activity';
}

interface CarouselHeroProps {
  cards: CarouselCardData[];
  autoAdvance?: boolean;
  advanceInterval?: number;
  className?: string;
}

export const CarouselHero = React.forwardRef<HTMLDivElement, CarouselHeroProps>(
  ({ 
    cards, 
    autoAdvance = true, 
    advanceInterval = 8000, 
    className 
  }, ref) => {
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(false);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    // Auto-advance logic
    React.useEffect(() => {
      if (!autoAdvance || isPaused || cards.length <= 1) return;

      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % cards.length);
      }, advanceInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [autoAdvance, isPaused, advanceInterval, cards.length]);

    const getCardPosition = (index: number) => {
      const diff = index - activeIndex;
      if (diff === 0) return 'center';
      if (diff === 1 || (diff === -(cards.length - 1))) return 'right';
      if (diff === -1 || (diff === cards.length - 1)) return 'left';
      return 'hidden';
    };

    const getThemeClasses = (theme?: string) => {
      switch (theme) {
        case 'revenue':
          return 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20';
        case 'community':
          return 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20';
        case 'agencies':
          return 'border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20';
        case 'activity':
          return 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20';
        default:
          return 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20';
      }
    };

    const navigateToCard = (index: number) => {
      setActiveIndex(index);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 3000); // Resume auto-advance after 3s
    };

    const navigatePrev = () => {
      setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 3000);
    };

    const navigateNext = () => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 3000);
    };

    return (
      <div 
        ref={ref}
        className={cn('relative h-80 overflow-hidden', className)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Navigation buttons */}
        <Button
          variant="outline"
          size="sm"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm"
          onClick={navigatePrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm"
          onClick={navigateNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Cards container */}
        <div className="relative flex items-center justify-center h-full perspective-1000">
          {cards.map((card, index) => {
            const position = getCardPosition(index);
            
            return (
              <Card
                key={card.id}
                className={cn(
                  'absolute transition-all duration-700 ease-out cursor-pointer',
                  getThemeClasses(card.theme),
                  {
                    // Center card - full prominence
                    'w-full max-w-2xl h-72 z-10 scale-100 opacity-100': position === 'center',
                    // Left card - partially visible, scaled down
                    'w-full max-w-2xl h-72 -translate-x-80 scale-85 opacity-60 z-5': position === 'left',
                    // Right card - partially visible, scaled down  
                    'w-full max-w-2xl h-72 translate-x-80 scale-85 opacity-60 z-5': position === 'right',
                    // Hidden cards
                    'w-full max-w-2xl h-72 scale-75 opacity-0 z-0': position === 'hidden',
                  }
                )}
                onClick={() => position !== 'center' && navigateToCard(index)}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                      <CardDescription className="text-sm">{card.description}</CardDescription>
                    </div>
                    {card.cta && position === 'center' && (
                      <div>
                        {card.cta.variant === 'delightful' ? (
                          <DelightfulButton 
                            onClick={card.cta.action}
                            className="gap-2"
                            optimistic={true}
                            haptic="medium"
                            celebration={false}
                          >
                            {card.cta.text}
                          </DelightfulButton>
                        ) : card.cta.href ? (
                          <Button asChild variant={card.cta.variant || 'default'}>
                            <Link href={card.cta.href}>{card.cta.text}</Link>
                          </Button>
                        ) : (
                          <Button 
                            variant={card.cta.variant || 'default'}
                            onClick={card.cta.action}
                          >
                            {card.cta.text}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {card.content}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {cards.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === activeIndex 
                  ? 'bg-primary scale-125' 
                  : 'bg-primary/30 hover:bg-primary/60'
              )}
              onClick={() => navigateToCard(index)}
            />
          ))}
        </div>
      </div>
    );
  }
);

CarouselHero.displayName = 'CarouselHero';