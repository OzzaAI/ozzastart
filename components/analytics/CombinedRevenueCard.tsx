'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  DollarSign, 
  HelpCircle,
  Zap,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Clock,
  CreditCard
} from 'lucide-react';

// Dynamic import to avoid SSR issues with ApexCharts
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => (
    <div className="h-96 glass-card rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-300">Loading chart...</div>
    </div>
  )
});

interface CombinedRevenueCardProps {
  monthlyEarnings?: number;
  todaysEarnings?: number;
  weeklyEarnings?: number;
  lifetimeEarnings?: number;
  lastPaymentAmount?: number;
  className?: string;
}

export default function CombinedRevenueCard({
  monthlyEarnings = 8420,
  todaysEarnings = 450,
  weeklyEarnings = 1580,
  lifetimeEarnings = 24750,
  lastPaymentAmount = 0,
  className = ''
}: CombinedRevenueCardProps) {
  const [animatedBalance, setAnimatedBalance] = useState(monthlyEarnings);
  const [showNewEarning, setShowNewEarning] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Sample data that matches the Stan Store style
  const revenueData = [
    0, 1200, 1800, 1500, 2200, 2800, 2400, 3200, 3800, 3400, 
    4200, 4800, 4400, 5200, 5800, 5400, 6200, 6800, 6400, 7200, 
    7800, 7400, 8200, 8800, 8400, 9200, 9800, 9400, monthlyEarnings
  ];

  // Animate balance updates when new payments come in
  useEffect(() => {
    if (lastPaymentAmount > 0) {
      setShowNewEarning(true);
      
      // Animate the balance increase
      const increment = lastPaymentAmount / 20;
      let current = monthlyEarnings - lastPaymentAmount;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= monthlyEarnings) {
          current = monthlyEarnings;
          clearInterval(timer);
          setTimeout(() => setShowNewEarning(false), 3000);
        }
        setAnimatedBalance(Math.round(current));
      }, 50);

      return () => clearInterval(timer);
    }
  }, [lastPaymentAmount, monthlyEarnings]);

  const chartOptions = {
    chart: {
      type: 'area' as const,
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent'
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth' as const,
      width: 3,
      colors: ['#14b8a6']
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.4,
        gradientToColors: ['rgba(20, 184, 166, 0.1)'],
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.05,
        stops: [0, 40, 80, 100],
        colorStops: [
          {
            offset: 0,
            color: '#12b5a8',
            opacity: 0.6
          },
          {
            offset: 40,
            color: '#0f9b94',
            opacity: 0.4
          },
          {
            offset: 80,
            color: '#0d7983',
            opacity: 0.15
          },
          {
            offset: 100,
            color: 'rgba(6, 182, 212, 0.005)',
            opacity: 0.005
          }
        ]
      }
    },
    colors: ['#1e40af'],
    grid: { show: false },
    xaxis: {
      categories: Array.from({ length: 29 }, (_, i) => `Jun ${i + 2}`),
      labels: {
        show: true,
        style: {
          colors: '#94A3B8',
          fontSize: '12px'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { show: false },
    legend: { show: false },
    markers: { size: 0 },
    tooltip: {
      enabled: true,
      theme: 'dark' as const,
      style: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#ffffff'
      },
      y: {
        formatter: function(value: number) {
          return '$' + value.toLocaleString();
        }
      }
    }
  };

  const series = [{
    name: 'Revenue',
    data: revenueData
  }];

  const percentageChange = weeklyEarnings > 0 
    ? ((todaysEarnings / (weeklyEarnings / 7)) - 1) * 100 
    : 0;

  return (
    <div className={`relative bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl overflow-hidden shadow-2xl shadow-black/40 ${className}`}>
      {/* Sparkle animation when new earnings come in */}
      {showNewEarning && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <Sparkles className="absolute top-6 right-6 w-6 h-6 text-emerald-500 animate-bounce" />
          <Sparkles className="absolute top-12 left-8 w-4 h-4 text-blue-500 animate-pulse" />
          <Sparkles className="absolute bottom-20 right-12 w-5 h-5 text-amber-500 animate-ping" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Chart Section */}
        <div className="lg:col-span-2 p-6 bg-gradient-to-br from-white/2 via-transparent to-teal-500/4 backdrop-blur-lg">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">Total Revenue</h3>
            <HelpCircle className="w-4 h-4 text-teal-400" />
            {showNewEarning && lastPaymentAmount && (
              <div className="ml-auto bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium animate-pulse border border-emerald-500/30">
                +${lastPaymentAmount}
              </div>
            )}
          </div>
          
          <div className="text-3xl font-bold text-white mb-6">
            ${monthlyEarnings.toLocaleString()}
          </div>
          
          <div style={{ minHeight: '280px' }} className="mt-2">
            <Chart
              options={chartOptions}
              series={series}
              type="area"
              height={280}
            />
          </div>
        </div>

        {/* Earnings Summary Section */}
        <div className="lg:col-span-1 bg-gradient-to-br from-emerald-500/4 via-transparent to-blue-500/3 border-l border-white/10 backdrop-blur-sm">

          {/* Main Balance */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-300 mb-2 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                This Month
              </div>
              <div className={`text-3xl font-bold transition-all duration-500 ${
                showNewEarning ? 'text-emerald-400 scale-110' : 'text-white'
              }`}>
                ${animatedBalance.toLocaleString()}
              </div>
            </div>

            {/* Today's Performance */}
            <div className="bg-gradient-to-br from-emerald-400/8 via-emerald-500/5 to-transparent rounded-lg p-4 mb-6 backdrop-blur-3xl border border-white/8 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-white text-sm">Today's Earnings</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">
                  ${todaysEarnings.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-gray-300">
                  +24.3% vs last month
                </span>
              </div>
            </div>

            {/* Payment Style Info */}
            <div className="bg-gradient-to-br from-emerald-400/8 via-emerald-500/5 to-transparent rounded-lg p-4 mb-6 backdrop-blur-3xl border border-white/8 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white text-sm">Payment Style</span>
                </div>
                <span className="bg-emerald-500/25 text-emerald-300 px-2 py-1 rounded-full text-xs font-medium border border-emerald-500/40 backdrop-blur-sm">
                  Automatic
                </span>
              </div>
            </div>

            {/* Breakdown Toggle */}
            <div className="pb-4">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-300 font-medium transition-colors text-sm"
              >
                <TrendingUp className="w-4 h-4" />
                {showBreakdown ? 'Hide' : 'View'} Detailed Breakdown
              </button>
            </div>
              
            {showBreakdown && (
              <div className="pt-4 border-t border-white/20">
                <div className="space-y-2 bg-white/8 rounded-lg p-3 border border-white/25 backdrop-blur-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Today</span>
                    <span className="font-semibold text-white">${todaysEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">This Week</span>
                    <span className="font-semibold text-white">${weeklyEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">This Month</span>
                    <span className="font-semibold text-emerald-400">${monthlyEarnings.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-white/30 pt-2 flex justify-between items-center text-sm">
                    <span className="text-gray-300">All Time</span>
                    <span className="font-bold text-white">${lifetimeEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Info */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-300 bg-white/8 rounded-lg p-3 border border-white/25 backdrop-blur-lg">
              <CreditCard className="w-3 h-3" />
              <span>Transfers to Chase Bank •••• 4521</span>
              <Clock className="w-3 h-3 ml-auto" />
              <span>Instant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}