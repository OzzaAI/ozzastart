/**
 * Simple Payment System
 * 
 * Revenue tracking and balance management for coaches
 */

export interface EarningsRecord {
  id: string;
  coachId: string;
  clientId: string;
  amount: number; // in cents
  platformFee: number; // in cents
  coachAmount: number; // in cents
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface CoachBalance {
  monthlyRevenue: number;
  todaysEarnings: number;
  weeklyEarnings: number;
  lifetimeEarnings: number;
}

/**
 * Get real-time coach balance and earnings
 */
export async function getCoachBalance(coachId: string): Promise<CoachBalance> {
  // Return mock data for development
  return {
    monthlyRevenue: 842000,   // $8,420
    todaysEarnings: 18500,    // $185
    weeklyEarnings: 89300,    // $893
    lifetimeEarnings: 542800  // $5,428
  };
}

// Mock earnings records for development
export async function getEarningsRecords(coachId: string): Promise<EarningsRecord[]> {
  return [
    {
      id: '1',
      coachId,
      clientId: 'client1',
      amount: 10000,
      platformFee: 1000,
      coachAmount: 9000,
      status: 'completed',
      createdAt: new Date(),
    }
  ];
}