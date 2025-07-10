'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUp, 
  Settings, 
  Clock, 
  CheckCircle, 
  Zap,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';

interface CashOutCardProps {
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  className?: string;
  onCashOut?: (amount: number) => Promise<void>;
  onViewBreakdown?: () => void;
}

export default function CashOutCard({
  availableBalance = 8500,
  pendingBalance = 3200,
  lifetimeEarnings = 24750,
  className = '',
  onCashOut,
  onViewBreakdown
}: CashOutCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLifetime, setShowLifetime] = useState(false);

  const handleCashOut = async () => {
    if (availableBalance === 0) return;
    
    setIsProcessing(true);
    try {
      await onCashOut?.(availableBalance);
      // Show success animation/notification
    } catch (error) {
      console.error('Cash out failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewBreakdown = () => {
    setShowBreakdown(!showBreakdown);
    onViewBreakdown?.();
  };

  return (
    <div className={`bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl shadow-lg border border-emerald-200 overflow-hidden ${className}`}>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Your Earnings</h3>
              <p className="text-emerald-100 text-sm">Ready to cash out</p>
            </div>
          </div>
          <button
            onClick={() => setShowLifetime(!showLifetime)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {showLifetime ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Available Balance */}
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Available for Cash Out
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            ${availableBalance.toLocaleString()}
          </div>
          
          {/* Lifetime Earnings Toggle */}
          {showLifetime && (
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4" />
              ${lifetimeEarnings.toLocaleString()} lifetime earnings
            </div>
          )}
        </div>

        {/* Cash Out Button */}
        <button
          onClick={handleCashOut}
          disabled={availableBalance === 0 || isProcessing}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
            availableBalance > 0 && !isProcessing
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <ArrowUp className="w-5 h-5" />
              Cash Out ${availableBalance.toLocaleString()}
            </>
          )}
        </button>

        {/* Pending Section */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Processing Soon</span>
            </div>
            <span className="text-lg font-semibold text-amber-900">
              ${pendingBalance.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-amber-700">
            Available in 24-48 hours after payment confirmation
          </p>
        </div>

        {/* Breakdown Section */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={handleViewBreakdown}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Zap className="w-4 h-4" />
            View earnings breakdown
          </button>
          
          {showBreakdown && (
            <div className="mt-4 space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Coaching Services</span>
                <span className="font-medium">${(pendingBalance * 0.7).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Agency Commissions</span>
                <span className="font-medium">${(pendingBalance * 0.2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Referral Bonuses</span>
                <span className="font-medium">${(pendingBalance * 0.1).toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between text-sm font-semibold">
                <span>Total Processing</span>
                <span>${pendingBalance.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          <Settings className="w-4 h-4" />
          Payout Settings
        </button>
      </div>

      {/* Success Animation Overlay (when cashing out) */}
      {isProcessing && (
        <div className="absolute inset-0 bg-emerald-600/90 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-bounce mb-2">
              <CheckCircle className="w-12 h-12 mx-auto" />
            </div>
            <p className="font-semibold">Processing your cash out...</p>
          </div>
        </div>
      )}
    </div>
  );
}