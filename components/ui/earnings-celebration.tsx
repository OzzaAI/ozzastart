'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, Target, TrendingUp, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarningsCelebrationProps {
  monthlyEarnings: number;
  previousEarnings: number;
  agencyCount: number;
  isVisible: boolean;
  onShare?: () => void;
  onClose?: () => void;
}

export const EarningsCelebration = React.forwardRef<HTMLDivElement, EarningsCelebrationProps>(
  ({ monthlyEarnings, previousEarnings, agencyCount, isVisible, onShare, onClose }, ref) => {
    const growth = previousEarnings > 0 ? ((monthlyEarnings - previousEarnings) / previousEarnings) * 100 : 0;
    const isFirstEarnings = previousEarnings === 0 && monthlyEarnings > 0;
    const isSignificantGrowth = growth >= 25;
    const isMilestone = monthlyEarnings >= 1000 && previousEarnings < 1000;

    if (!isVisible || (!isFirstEarnings && !isSignificantGrowth && !isMilestone)) {
      return null;
    }

    const celebrationConfig = {
      firstEarnings: {
        title: "🎉 First Earnings!",
        subtitle: "You've officially started your coaching journey",
        bgGradient: "from-green-400 via-blue-500 to-purple-600",
        emoji: "🚀"
      },
      significantGrowth: {
        title: "📈 Explosive Growth!",
        subtitle: `${growth.toFixed(0)}% increase in earnings`,
        bgGradient: "from-orange-400 via-red-500 to-pink-600", 
        emoji: "💥"
      },
      milestone: {
        title: "🏆 $1,000+ Milestone!",
        subtitle: "You're building serious coaching income",
        bgGradient: "from-yellow-400 via-orange-500 to-red-500",
        emoji: "👑"
      }
    };

    const config = isFirstEarnings ? celebrationConfig.firstEarnings :
                  isMilestone ? celebrationConfig.milestone :
                  celebrationConfig.significantGrowth;

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <Card className={cn(
            "relative overflow-hidden max-w-md w-full",
            "border-none shadow-2xl"
          )}>
            {/* Animated Background */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-90",
              config.bgGradient
            )} />
            
            {/* Floating Sparkles */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white/30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-10, -20, -10],
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
              ))}
            </div>

            <CardContent className="relative p-8 text-center text-white">
              {/* Main Celebration */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                className="mb-6"
              >
                <div className="text-6xl mb-4">{config.emoji}</div>
                <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
                <p className="text-white/90">{config.subtitle}</p>
              </motion.div>

              {/* Earnings Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mb-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
              >
                <div className="text-3xl font-bold mb-1">
                  ${monthlyEarnings.toLocaleString()}
                </div>
                <div className="text-sm text-white/80">
                  Earned this month from {agencyCount} {agencyCount === 1 ? 'agency' : 'agencies'}
                </div>
                {growth > 0 && (
                  <Badge className="mt-2 bg-white/20 text-white border-white/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{growth.toFixed(0)}% growth
                  </Badge>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex gap-3"
              >
                <Button
                  onClick={onShare}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Achievement
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-white text-gray-900 hover:bg-white/90"
                >
                  Continue
                </Button>
              </motion.div>

              {/* Inspirational Quote */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-6 text-xs text-white/70 italic"
              >
                "Every coach who changed the world started with their first dollar"
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }
);

EarningsCelebration.displayName = 'EarningsCelebration';