'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'currency';
  isLoading?: boolean;
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  format = 'number',
  isLoading 
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-4 w-4" />;
    return change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-400';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 truncate pr-2">{title}</h3>
        {icon && <div className="text-gray-400 flex-shrink-0">{icon}</div>}
      </div>
      
      <div className="mt-2">
        <div className="flex items-baseline">
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 break-all">
            {formatValue(value)}
          </p>
        </div>
        
        {change !== undefined && (
          <div className={`mt-2 flex items-center text-xs sm:text-sm ${getTrendColor()}`}>
            <div className="flex-shrink-0">{getTrendIcon()}</div>
            <span className="ml-1 truncate">
              {Math.abs(change)}% {changeLabel || 'vs last period'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}