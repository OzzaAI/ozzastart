'use client';

import { useState, useEffect } from 'react';

export interface CoachEarnings {
  availableBalance: number;
  todaysEarnings: number;
  weeklyEarnings: number;
  lifetimeEarnings: number;
  lastPaymentAmount?: number;
}

export function useCoachEarnings() {
  const [earnings, setEarnings] = useState<CoachEarnings>({
    availableBalance: 0,
    todaysEarnings: 0,
    weeklyEarnings: 0,
    lifetimeEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial earnings data
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await fetch('/api/coach/cash-out');
        if (!response.ok) {
          throw new Error('Failed to fetch earnings');
        }
        
        const data = await response.json();
        setEarnings(data.balance);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch earnings');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // Simulate real-time updates (you'd use WebSockets or Server-Sent Events in production)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random new earnings (remove in production)
      if (Math.random() > 0.95) { // 5% chance every interval
        const newPayment = Math.floor(Math.random() * 500) + 50; // $50-$550
        setEarnings(prev => ({
          ...prev,
          availableBalance: prev.availableBalance + newPayment,
          todaysEarnings: prev.todaysEarnings + newPayment,
          weeklyEarnings: prev.weeklyEarnings + newPayment,
          lifetimeEarnings: prev.lifetimeEarnings + newPayment,
          lastPaymentAmount: newPayment
        }));
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const cashOut = async (): Promise<void> => {
    try {
      const response = await fetch('/api/coach/cash-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Cash out failed');
      }
      
      const result = await response.json();
      
      // Reset available balance after cash out
      setEarnings(prev => ({
        ...prev,
        availableBalance: 0
      }));
      
      return result;
    } catch (error) {
      console.error('Cash out error:', error);
      throw error;
    }
  };

  return {
    earnings,
    loading,
    error,
    cashOut
  };
}