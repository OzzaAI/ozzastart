'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { toast as sonnerToast, Toaster } from 'sonner';
import { Check, AlertCircle, Info, AlertTriangle, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantStyles = {
  default: {
    className: 'border-border bg-background text-foreground',
    icon: <Info className="h-4 w-4" />
  },
  success: {
    className: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
    icon: <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
  },
  error: {
    className: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    icon: <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
  },
  warning: {
    className: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
    icon: <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
  },
  info: {
    className: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
    icon: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  }
};

const DelightfulToastContent = ({ 
  title, 
  description, 
  variant = 'default', 
  icon, 
  action, 
  dismissible = true,
  onDismiss 
}: ToastOptions) => {
  const variantConfig = variantStyles[variant];
  const displayIcon = icon || variantConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        variantConfig.className
      )}>
      {displayIcon && (
        <div className="flex-shrink-0 mt-0.5">
          {displayIcon}
        </div>
      )}
      
      <div className="flex-1 space-y-1">
        {title && (
          <div className="font-semibold text-sm leading-none">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm opacity-90 leading-relaxed">
            {description}
          </div>
        )}
        
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'h-8 px-3 mt-2'
            )}
          >
            {action.label}
          </button>
        )}
      </div>
      
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
};

// Enhanced toast functions with delightful defaults
export const delightfulToast = {
  success: (message: string, options: Partial<ToastOptions> = {}) => {
    return sonnerToast.custom(
      (t) => (
        <DelightfulToastContent
          title="Success!"
          description={message}
          variant="success"
          dismissible={true}
          onDismiss={() => sonnerToast.dismiss(t)}
          {...options}
        />
      ),
      {
        duration: 4000,
        position: 'top-right',
        ...options
      }
    );
  },

  error: (message: string, options: Partial<ToastOptions> = {}) => {
    return sonnerToast.custom(
      (t) => (
        <DelightfulToastContent
          title="Error"
          description={message}
          variant="error"
          dismissible={true}
          onDismiss={() => sonnerToast.dismiss(t)}
          {...options}
        />
      ),
      {
        duration: 6000,
        position: 'top-right',
        ...options
      }
    );
  },

  warning: (message: string, options: Partial<ToastOptions> = {}) => {
    return sonnerToast.custom(
      (t) => (
        <DelightfulToastContent
          title="Warning"
          description={message}
          variant="warning"
          dismissible={true}
          onDismiss={() => sonnerToast.dismiss(t)}
          {...options}
        />
      ),
      {
        duration: 5000,
        position: 'top-right',
        ...options
      }
    );
  },

  info: (message: string, options: Partial<ToastOptions> = {}) => {
    return sonnerToast.custom(
      (t) => (
        <DelightfulToastContent
          title="Info"
          description={message}
          variant="info"
          dismissible={true}
          onDismiss={() => sonnerToast.dismiss(t)}
          {...options}
        />
      ),
      {
        duration: 4000,
        position: 'top-right',
        ...options
      }
    );
  },

  // Special toast for successful copying
  copied: (text?: string) => {
    return delightfulToast.success(
      text ? `Copied "${text}" to clipboard` : 'Copied to clipboard',
      {
        icon: <Copy className="h-4 w-4 text-green-600 dark:text-green-400" />,
        duration: 2000,
      }
    );
  },

  // Loading toast that can be updated
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      duration: Infinity,
    });
  },

  // Promise-based toast that automatically handles success/error states
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  // Dismiss all toasts
  dismiss: sonnerToast.dismiss,
};

// Export the enhanced Toaster component
export const DelightfulToaster = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      style: {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
      },
    }}
    className="toaster group"
  />
);

export { sonnerToast as toast };