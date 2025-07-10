'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUp, 
  Zap,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Clock,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useCoachEarnings } from '@/hooks/useCoachEarnings';

interface EnhancedCashOutCardProps {
  className?: string;
}

export default function EnhancedCashOutCard({ className = '' }: EnhancedCashOutCardProps) {
  const { earnings, loading, error, cashOut } = useCoachEarnings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNewEarning, setShowNewEarning] = useState(false);

  // Show animation when new earnings come in
  React.useEffect(() => {
    if (earnings.lastPaymentAmount && earnings.lastPaymentAmount > 0) {
      setShowNewEarning(true);
      setTimeout(() => setShowNewEarning(false), 3000);
    }
  }, [earnings.lastPaymentAmount]);

  const handleCashOut = async () => {
    if (earnings.availableBalance === 0) return;
    
    setIsProcessing(true);
    
    try {
      await cashOut();
      setShowSuccess(true);
      
      // Reset success state
      setTimeout(() => {
        setShowSuccess(false);
        setIsProcessing(false);
      }, 3000);
      
    } catch (error) {
      console.error('Cash out failed:', error);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-xl p-6 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-300 rounded mb-4"></div>
        <div className="h-8 bg-gray-300 rounded mb-6"></div>
        <div className="h-12 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Failed to load earnings</span>
        </div>
        <p className="text-red-500 text-sm mt-2">{error}</p>
      </div>
    );
  }

  const percentageChange = earnings.weeklyEarnings > 0 
    ? ((earnings.todaysEarnings / (earnings.weeklyEarnings / 7)) - 1) * 100 
    : 0;

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
              <p className="text-emerald-100 text-sm">Ready to cash out instantly</p>
            </div>
          </div>
          {showNewEarning && earnings.lastPaymentAmount && (
            <div className="bg-white/20 px-3 py-1 rounded-full animate-pulse">
              <span className="text-white text-sm font-medium">
                +${earnings.lastPaymentAmount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Balance */}
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Available for Cash Out
          </div>
          <div className={`text-4xl font-bold transition-all duration-500 ${
            showNewEarning ? 'text-emerald-600 scale-110' : 'text-gray-900'
          }`}>
            ${earnings.availableBalance.toLocaleString()}
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
              ${earnings.todaysEarnings.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-600">
              {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}% vs daily average
            </span>
          </div>
        </div>

        {/* Cash Out Button */}
        <button
          onClick={handleCashOut}
          disabled={earnings.availableBalance === 0 || isProcessing || showSuccess}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
            earnings.availableBalance > 0 && !isProcessing && !showSuccess
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
              : showSuccess
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {showSuccess ? (
            <>
              <CheckCircle className="w-5 h-5" />
              ${earnings.availableBalance.toLocaleString()} Sent to Your Bank!
            </>
          ) : isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Processing Cash Out...
            </>
          ) : (
            <>
              <ArrowUp className="w-5 h-5" />
              Cash Out ${earnings.availableBalance.toLocaleString()}
            </>
          )}
        </button>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">This Week</div>
            <div className="text-lg font-semibold text-gray-900">
              ${earnings.weeklyEarnings.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">All Time</div>
            <div className="text-lg font-semibold text-gray-900">
              ${earnings.lifetimeEarnings.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <CreditCard className="w-4 h-4" />
          <span>Transfers to Chase Bank •••• 4521</span>
          <Clock className="w-4 h-4 ml-auto" />
          <span>Instant</span>
        </div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/95 to-blue-500/95 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-bounce mb-4">
              <CheckCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-bold mb-2">Cash Out Successful!</h3>
            <p className="text-emerald-100">
              ${earnings.availableBalance.toLocaleString()} is on its way to your bank account
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>Usually arrives within minutes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}