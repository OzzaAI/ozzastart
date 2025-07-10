'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PrefetchOptions {
  delay?: number;
  priority?: 'high' | 'low';
  preloadData?: boolean;
  cacheKey?: string;
}

interface HoverPrefetchReturn {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  prefetch: () => void;
  isHovering: boolean;
}

// Global cache for prefetched data
const prefetchCache = new Map<string, any>();

export function useHoverPrefetch(
  href: string,
  options: PrefetchOptions = {}
): HoverPrefetchReturn {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isHoveringRef = useRef(false);
  
  const {
    delay = 100,
    priority = 'low',
    preloadData = false,
    cacheKey,
  } = options;

  const prefetch = useCallback(() => {
    // Prefetch the route
    router.prefetch(href);
    
    // Optionally preload API data
    if (preloadData && cacheKey) {
      const cached = prefetchCache.get(cacheKey);
      if (!cached) {
        // Determine API endpoint from href
        const apiEndpoint = getApiEndpointFromHref(href);
        if (apiEndpoint) {
          fetch(apiEndpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then(response => response.json())
            .then(data => {
              prefetchCache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                ttl: 5 * 60 * 1000, // 5 minutes
              });
            })
            .catch(console.error);
        }
      }
    }
  }, [href, router, preloadData, cacheKey]);

  const onMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set prefetch timeout
    timeoutRef.current = setTimeout(() => {
      if (isHoveringRef.current) {
        prefetch();
      }
    }, delay);
  }, [prefetch, delay]);

  const onMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    onMouseEnter,
    onMouseLeave,
    prefetch,
    isHovering: isHoveringRef.current,
  };
}

// Helper function to determine API endpoint from href
function getApiEndpointFromHref(href: string): string | null {
  const patterns = [
    { pattern: /\/dashboard\/coach\/agencies/, endpoint: '/api/coach/agencies' },
    { pattern: /\/dashboard\/coach\/performance/, endpoint: '/api/coach/analytics' },
    { pattern: /\/dashboard\/coach\/training/, endpoint: '/api/coach/training' },
    { pattern: /\/dashboard\/agency/, endpoint: '/api/agency/dashboard' },
    { pattern: /\/dashboard\/client/, endpoint: '/api/client/dashboard' },
  ];

  for (const { pattern, endpoint } of patterns) {
    if (pattern.test(href)) {
      return endpoint;
    }
  }

  return null;
}

// Hook for prefetching multiple routes
export function useBatchPrefetch() {
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());

  const prefetchRoutes = useCallback((routes: string[]) => {
    routes.forEach(route => {
      if (!prefetchedRoutes.current.has(route)) {
        router.prefetch(route);
        prefetchedRoutes.current.add(route);
      }
    });
  }, [router]);

  const prefetchUserFlow = useCallback((userRole: 'coach' | 'agency' | 'client') => {
    const flows = {
      coach: [
        '/dashboard/coach',
        '/dashboard/coach/agencies',
        '/dashboard/coach/performance',
        '/dashboard/coach/training',
        '/dashboard/settings',
      ],
      agency: [
        '/dashboard/agency',
        '/dashboard/agency/clients',
        '/dashboard/agency/projects',
        '/dashboard/settings',
      ],
      client: [
        '/dashboard/client',
        '/dashboard/client/progress',
        '/dashboard/settings',
      ],
    };

    prefetchRoutes(flows[userRole]);
  }, [prefetchRoutes]);

  return {
    prefetchRoutes,
    prefetchUserFlow,
    clearCache: () => {
      prefetchedRoutes.current.clear();
      prefetchCache.clear();
    },
  };
}

// Hook for intelligent prefetching based on user behavior
export function useIntelligentPrefetch() {
  const { prefetchUserFlow } = useBatchPrefetch();
  const behaviorRef = useRef({
    visitHistory: [] as string[],
    timeSpent: new Map<string, number>(),
    lastActivity: Date.now(),
  });

  const trackPageVisit = useCallback((page: string) => {
    const behavior = behaviorRef.current;
    const now = Date.now();
    
    // Track time spent on previous page
    if (behavior.visitHistory.length > 0) {
      const previousPage = behavior.visitHistory[behavior.visitHistory.length - 1];
      const timeSpent = now - behavior.lastActivity;
      behavior.timeSpent.set(previousPage, 
        (behavior.timeSpent.get(previousPage) || 0) + timeSpent
      );
    }

    // Add to visit history
    behavior.visitHistory.push(page);
    behavior.lastActivity = now;

    // Predict next likely pages
    const predictions = predictNextPages(behavior.visitHistory);
    if (predictions.length > 0) {
      // Prefetch top predictions
      predictions.slice(0, 2).forEach(prediction => {
        if (typeof window !== 'undefined') {
          const router = (window as any).__NEXT_ROUTER__;
          if (router) {
            router.prefetch(prediction);
          }
        }
      });
    }
  }, []);

  return {
    trackPageVisit,
    getBehaviorData: () => behaviorRef.current,
  };
}

// Simple prediction algorithm for next pages
function predictNextPages(visitHistory: string[]): string[] {
  const patterns = [
    // Coach patterns
    { from: '/dashboard/coach', to: ['/dashboard/coach/agencies', '/dashboard/coach/performance'] },
    { from: '/dashboard/coach/agencies', to: ['/dashboard/coach/performance', '/dashboard/coach/training'] },
    
    // Agency patterns  
    { from: '/dashboard/agency', to: ['/dashboard/agency/clients', '/dashboard/agency/projects'] },
    
    // Common patterns
    { from: /\/dashboard\/.*/, to: ['/dashboard/settings'] },
  ];

  const currentPage = visitHistory[visitHistory.length - 1];
  const predictions: string[] = [];

  for (const pattern of patterns) {
    const matches = typeof pattern.from === 'string' 
      ? currentPage === pattern.from
      : pattern.from.test(currentPage);
      
    if (matches) {
      predictions.push(...pattern.to);
    }
  }

  return [...new Set(predictions)]; // Remove duplicates
}

// Utility to get cached data
export function getCachedData(cacheKey: string) {
  const cached = prefetchCache.get(cacheKey);
  if (!cached) return null;

  // Check if data is still valid
  const isExpired = Date.now() - cached.timestamp > cached.ttl;
  if (isExpired) {
    prefetchCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}