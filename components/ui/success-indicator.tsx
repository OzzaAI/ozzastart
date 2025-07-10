'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessIndicatorProps {
  show: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'minimal' | 'accent';
  duration?: number;
}

export const SuccessIndicator = React.forwardRef<HTMLDivElement, SuccessIndicatorProps>(
  ({ show, children, className, variant = 'default', duration = 2000 }, ref) => {
    const [localShow, setLocalShow] = React.useState(show);

    React.useEffect(() => {
      if (show) {
        setLocalShow(true);
        const timer = setTimeout(() => setLocalShow(false), duration);
        return () => clearTimeout(timer);
      }
    }, [show, duration]);

    const variants = {
      default: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
      minimal: 'bg-transparent border-transparent text-green-600 dark:text-green-400',
      accent: 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25'
    };

    return (
      <AnimatePresence>
        {localShow && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium',
              variants[variant],
              className
            )}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
            >
              <Check className="h-4 w-4" />
            </motion.div>
            {children && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                {children}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

SuccessIndicator.displayName = 'SuccessIndicator';

// Subtle success glow effect for buttons
export const SuccessGlow = ({ show, children }: { show: boolean; children: React.ReactNode }) => (
  <div className="relative">
    {children}
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-md bg-green-400/20 pointer-events-none animate-pulse"
        />
      )}
    </AnimatePresence>
  </div>
);

// Minimal checkmark that appears briefly
export const QuickSuccess = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.2, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full"
      >
        <Check className="h-3 w-3" />
      </motion.div>
    )}
  </AnimatePresence>
);