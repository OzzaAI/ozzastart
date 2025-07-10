'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, Check, AlertCircle } from 'lucide-react';

const delightfulButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden transform-gpu will-change-transform',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] transition-all duration-150',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:scale-[1.02] hover:shadow-lg hover:shadow-destructive/25 active:scale-[0.98]',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:scale-[0.98]',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-green-500 text-white shadow hover:bg-green-600 hover:shadow-lg active:scale-[0.98] ring-2 ring-green-200 dark:ring-green-800',
        premium: 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-[0.98]'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
      state: {
        idle: '',
        loading: 'cursor-wait opacity-90',
        success: 'cursor-default',
        error: 'cursor-default',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'idle',
    },
  }
);

export interface DelightfulButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof delightfulButtonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  haptic?: 'light' | 'medium' | 'heavy';
  celebration?: boolean;
  optimistic?: boolean;
  onOptimisticClick?: () => void;
}

const DelightfulButton = React.forwardRef<HTMLButtonElement, DelightfulButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      isLoading,
      isSuccess,
      isError,
      loadingText,
      successText,
      errorText,
      haptic = 'light',
      celebration = false,
      optimistic = false,
      onOptimisticClick,
      onClick,
      ...props
    },
    ref
  ) => {
    const [localSuccess, setLocalSuccess] = React.useState(false);
    const [localLoading, setLocalLoading] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);

    // Determine current state
    const currentState = isLoading || localLoading ? 'loading' 
      : isSuccess || localSuccess ? 'success'
      : isError ? 'error' 
      : 'idle';

    // Handle optimistic updates
    const handleClick = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (optimistic && onOptimisticClick) {
        setLocalSuccess(true);
        onOptimisticClick();
        
        // Reset after animation
        setTimeout(() => setLocalSuccess(false), 2000);
      }

      // Haptic feedback simulation (would need native API for real haptics)
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        const vibration = haptic === 'light' ? 10 : haptic === 'medium' ? 25 : 50;
        navigator.vibrate(vibration);
      }

      onClick?.(e);
    }, [optimistic, onOptimisticClick, haptic, onClick]);

    // Handle press animations
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsPressed(false);

    // Subtle success celebration effect
    React.useEffect(() => {
      if (celebration && (isSuccess || localSuccess)) {
        // Trigger subtle haptic feedback if available
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(25); // Gentle success pulse
        }
      }
    }, [celebration, isSuccess, localSuccess]);

    const Comp = asChild ? Slot : 'button';

    // Determine current content
    const getCurrentContent = () => {
      if (currentState === 'loading') {
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || 'Loading...'}
          </>
        );
      }
      
      if (currentState === 'success') {
        return (
          <>
            <Check className="h-4 w-4" />
            {successText || 'Success!'}
          </>
        );
      }
      
      if (currentState === 'error') {
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            {errorText || 'Error'}
          </>
        );
      }
      
      return children;
    };

    return (
      <>
        <Comp
          className={cn(
            delightfulButtonVariants({ variant: currentState === 'success' ? 'success' : variant, size, state: currentState }),
            isPressed && 'scale-95',
            className
          )}
          ref={ref}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          disabled={isLoading || localLoading || props.disabled}
          {...props}
        >
          {/* Ripple effect container */}
          <span className="absolute inset-0 overflow-hidden rounded-md">
            {/* Subtle glow for success state */}
            {(isSuccess || localSuccess) && (
              <span className="absolute inset-0 bg-green-400/20 rounded-md animate-pulse" />
            )}
          </span>
          
          {/* Content */}
          <span className="relative z-10 flex items-center gap-2">
            {getCurrentContent()}
          </span>
        </Comp>
      </>
    );
  }
);

DelightfulButton.displayName = 'DelightfulButton';

export { DelightfulButton, delightfulButtonVariants };