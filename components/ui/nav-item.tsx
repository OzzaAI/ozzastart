'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useHoverPrefetch } from '@/hooks/use-hover-prefetch';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  variant?: 'default' | 'compact';
  prefetch?: boolean;
}

export const NavItem = React.forwardRef<HTMLDivElement, NavItemProps>(
  ({ href, icon: Icon, label, isActive, variant = 'default', prefetch = true }, ref) => {
    const router = useRouter();
    const { onMouseEnter, onMouseLeave } = useHoverPrefetch(href, {
      delay: 100,
      preloadData: prefetch,
      cacheKey: `nav-${href}`,
    });

    const handleClick = React.useCallback(() => {
      router.push(href);
    }, [router, href]);

    return (
      <div
        ref={ref}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          'flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:cursor-pointer group relative',
          isActive
            ? 'bg-white/15 text-white shadow-md shadow-black/20 hover:bg-white/20 backdrop-blur-sm'
            : 'text-gray-400 hover:bg-white/10 hover:text-gray-200 hover:translate-x-0.5',
          variant === 'compact' && 'px-3 py-2 text-xs'
        )}
      >
        <Icon 
          className={cn(
            'h-5 w-5 transition-all duration-200',
            isActive ? 'scale-105' : 'group-hover:scale-102',
            variant === 'compact' && 'h-4 w-4'
          )} 
        />
        <span className="font-medium">{label}</span>
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        )}
        
        {/* Hover indicator */}
        <div className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-white/60 rounded-r-full transition-all duration-200',
          'group-hover:h-4 opacity-0 group-hover:opacity-60',
          isActive && 'h-6 opacity-100'
        )} />
        
        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
        </div>
      </div>
    );
  }
);

NavItem.displayName = 'NavItem';