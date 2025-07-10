'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface OptimisticActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  optimisticUpdate?: () => void;
  revertUpdate?: () => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
  timeout?: number;
}

interface UseOptimisticActionReturn<T> {
  execute: (action: () => Promise<T>) => Promise<T | null>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useOptimisticAction<T = any>(
  options: OptimisticActionOptions<T> = {}
): UseOptimisticActionReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const revertedRef = useRef(false);

  const {
    onSuccess,
    onError,
    optimisticUpdate,
    revertUpdate,
    successMessage = 'Action completed successfully',
    errorMessage = 'Something went wrong',
    showToast = true,
    timeout = 10000, // 10 second timeout
  } = options;

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    revertedRef.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const execute = useCallback(
    async (action: () => Promise<T>): Promise<T | null> => {
      reset();
      setIsLoading(true);
      revertedRef.current = false;

      // Apply optimistic update immediately
      if (optimisticUpdate) {
        optimisticUpdate();
      }

      // Set up timeout for reverting optimistic updates
      timeoutRef.current = setTimeout(() => {
        if (!revertedRef.current && revertUpdate) {
          revertUpdate();
          revertedRef.current = true;
          setIsError(true);
          setError(new Error('Request timeout'));
          setIsLoading(false);
          
          if (showToast) {
            toast.error('Request timed out. Please try again.');
          }
        }
      }, timeout);

      try {
        const result = await action();
        
        // Clear timeout since action succeeded
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (!revertedRef.current) {
          setIsLoading(false);
          setIsSuccess(true);

          // Show success feedback
          if (showToast) {
            toast.success(successMessage, {
              duration: 3000,
              position: 'top-right',
            });
          }

          // Call success callback
          if (onSuccess) {
            onSuccess(result);
          }

          // Auto-reset success state after a delay
          setTimeout(() => {
            setIsSuccess(false);
          }, 2000);

          return result;
        }
        
        return null;
      } catch (err) {
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        const error = err instanceof Error ? err : new Error('Unknown error');
        
        // Revert optimistic update if not already reverted
        if (!revertedRef.current && revertUpdate) {
          revertUpdate();
          revertedRef.current = true;
        }

        setIsLoading(false);
        setIsError(true);
        setError(error);

        // Show error feedback
        if (showToast) {
          toast.error(error.message || errorMessage, {
            duration: 5000,
            position: 'top-right',
            action: {
              label: 'Retry',
              onClick: () => execute(action),
            },
          });
        }

        // Call error callback
        if (onError) {
          onError(error);
        }

        return null;
      }
    },
    [
      reset,
      optimisticUpdate,
      revertUpdate,
      timeout,
      successMessage,
      errorMessage,
      showToast,
      onSuccess,
      onError,
    ]
  );

  return {
    execute,
    isLoading,
    isSuccess,
    isError,
    error,
    reset,
  };
}

// Specialized hook for form submissions
export function useOptimisticForm<T = any>(
  options: OptimisticActionOptions<T> = {}
) {
  return useOptimisticAction({
    successMessage: 'Form submitted successfully',
    errorMessage: 'Failed to submit form',
    ...options,
  });
}

// Specialized hook for data mutations
export function useOptimisticMutation<T = any>(
  options: OptimisticActionOptions<T> = {}
) {
  return useOptimisticAction({
    successMessage: 'Changes saved',
    errorMessage: 'Failed to save changes',
    ...options,
  });
}

// Hook for creating optimistic list operations
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[] = []
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [optimisticItems, setOptimisticItems] = useState<T[]>([]);

  const addOptimistic = useCallback((item: T) => {
    setOptimisticItems(prev => [...prev, item]);
  }, []);

  const removeOptimistic = useCallback((id: string | number) => {
    setOptimisticItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateOptimistic = useCallback((id: string | number, updates: Partial<T>) => {
    setOptimisticItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }, []);

  const clearOptimistic = useCallback(() => {
    setOptimisticItems([]);
  }, []);

  const syncWithServer = useCallback((serverItems: T[]) => {
    setItems(serverItems);
    clearOptimistic();
  }, [clearOptimistic]);

  const allItems = [...items, ...optimisticItems];

  return {
    items: allItems,
    serverItems: items,
    optimisticItems,
    addOptimistic,
    removeOptimistic,
    updateOptimistic,
    clearOptimistic,
    syncWithServer,
    setItems,
  };
}