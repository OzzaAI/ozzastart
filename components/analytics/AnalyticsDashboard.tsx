'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Eye, Users, Target, TrendingUp } from 'lucide-react';
import TrafficChart from './TrafficChart';
import MetricCard from './MetricCard';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface AnalyticsDashboardProps {
  hasAnalytics: boolean;
}

export default function AnalyticsDashboard({ hasAnalytics }: AnalyticsDashboardProps) {
  const [range, setRange] = useState('7d');

  const { data: summaryData, error: summaryError, isLoading: summaryLoading } = useSWR(
    hasAnalytics ? `/api/metrics?summary=true&range=${range}` : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  const { data: chartData, error: chartError, isLoading: chartLoading } = useSWR(
    hasAnalytics ? `/api/metrics?range=${range}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const rangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  if (!hasAnalytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Analytics Dashboard
        </h3>
        <p className="text-gray-600 mb-6">
          Get detailed insights into your portal performance with advanced analytics.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Included with Pro:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Real-time visitor tracking</li>
            <li>• Conversion rate analysis</li>
            <li>• Traffic source insights</li>
            <li>• Custom event tracking</li>
          </ul>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto">
          Upgrade to Pro
        </button>
      </div>
    );
  }

  const summary = summaryData?.summary || {
    total_views: 0,
    total_conversions: 0,
    unique_sessions: 0,
    conversion_rate: 0
  };

  const metrics = chartData?.metrics || [];

  return (
    <div className="space-y-6">
      {/* Header with range selector */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {rangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error handling */}
      {(summaryError || chartError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">
            {summaryError?.upgrade_required 
              ? 'Analytics dashboard not available on your current plan. Please upgrade to Pro.'
              : 'Failed to load analytics data. Please try again later.'}
          </p>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Page Views"
          value={summary.total_views}
          icon={<Eye className="h-5 w-5" />}
          isLoading={summaryLoading}
        />
        <MetricCard
          title="Unique Visitors"
          value={summary.unique_sessions}
          icon={<Users className="h-5 w-5" />}
          isLoading={summaryLoading}
        />
        <MetricCard
          title="Conversions"
          value={summary.total_conversions}
          icon={<Target className="h-5 w-5" />}
          isLoading={summaryLoading}
        />
        <MetricCard
          title="Conversion Rate"
          value={summary.conversion_rate}
          format="percentage"
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={summaryLoading}
        />
      </div>

      {/* Traffic Chart */}
      <TrafficChart 
        data={metrics} 
        isLoading={chartLoading}
        range={range}
      />
    </div>
  );
}