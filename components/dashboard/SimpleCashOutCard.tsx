'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowUp, 
  Zap,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Clock,
  CreditCard
} from 'lucide-react';

interface SimpleCashOutCardProps {
  monthlyEarnings: number;
  todaysEarnings: number;
  weeklyEarnings: number;
  lifetimeEarnings: number;
  lastPaymentAmount?: number;
  className?: string;
}

export default function SimpleCashOutCard({
  monthlyEarnings = 8420,
  todaysEarnings = 450,
  weeklyEarnings = 1580,
  lifetimeEarnings = 24750,
  lastPaymentAmount = 0,
  className = ''
}: SimpleCashOutCardProps) {
  const [animatedBalance, setAnimatedBalance] = useState(monthlyEarnings);
  const [showNewEarning, setShowNewEarning] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

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


  const percentageChange = weeklyEarnings > 0 ? ((todaysEarnings / (weeklyEarnings / 7)) - 1) * 100 : 0;

  return (
    <div className={`relative bg-gradient-to-br from-emerald-50 via-white to-blue-50 rounded-xl shadow-lg border border-emerald-200 overflow-hidden ${className}`}>
      {/* Sparkle animation when new earnings come in */}
      {showNewEarning && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-4 right-4 w-6 h-6 text-emerald-500 animate-bounce" />
          <Sparkles className="absolute top-8 left-6 w-4 h-4 text-blue-500 animate-pulse" />
          <Sparkles className="absolute bottom-12 right-8 w-5 h-5 text-amber-500 animate-ping" />
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Your Earnings</h3>
              <p className="text-emerald-100 text-sm">Real-time tracking</p>
            </div>
          </div>
          {showNewEarning && (
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">+${lastPaymentAmount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Balance */}
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            This Month
          </div>
          <div className={`text-4xl font-bold transition-all duration-500 ${
            showNewEarning ? 'text-emerald-600 scale-110' : 'text-gray-900'
          }`}>
            ${animatedBalance.toLocaleString()}
          </div>
        </div>

        {/* Today's Performance */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-gray-900">Today's Earnings</span>
            </div>
            <span className="text-xl font-bold text-emerald-600">
              ${todaysEarnings.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-600">
              {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}% vs daily average
            </span>
          </div>
        </div>

        {/* Payment Style Info */}
        <div className="bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-900">Payment Style</span>
            </div>
            <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Automatic
            </span>
          </div>
        </div>

        {/* Breakdown Toggle */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            {showBreakdown ? 'Hide' : 'View'} Detailed Breakdown
          </button>
          
          {showBreakdown && (
            <div className="mt-4 space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Today</span>
                <span className="font-semibold text-gray-900">${todaysEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="font-semibold text-gray-900">${weeklyEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="font-semibold text-emerald-600">${monthlyEarnings.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                <span className="text-sm text-gray-600">All Time</span>
                <span className="font-bold text-gray-900">${lifetimeEarnings.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bank Info */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <CreditCard className="w-4 h-4" />
          <span>Transfers to Chase Bank •••• 4521</span>
          <Clock className="w-4 h-4 ml-auto" />
          <span>Instant</span>
        </div>
      </div>

    </div>
  );
}