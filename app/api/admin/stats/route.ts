import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_accounts } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, count } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;

    // Verify admin access
    const userInfo = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    if (userInfo.length === 0 || userInfo[0].role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get system statistics
    const [totalUsersResult] = await db.select({ count: count() }).from(user);
    const totalUsers = totalUsersResult.count;

    const allUsers = await db.select({ role: user.role }).from(user);
    const totalCoaches = allUsers.filter(u => u.role === 'coach').length;
    const totalAdmins = allUsers.filter(u => u.role === 'admin').length;

    let totalAgencies = 0;
    try {
      const [agenciesResult] = await db.select({ count: count() }).from(ozza_accounts);
      totalAgencies = agenciesResult.count;
    } catch (error) {
      console.warn('Error counting agencies:', error);
    }

    // Mock additional stats for demonstration
    const stats = {
      totalUsers,
      totalCoaches,
      totalAgencies,
      totalClients: Math.floor(Math.random() * 150) + 50, // Mock data
      totalRevenue: Math.floor(Math.random() * 100000) + 25000, // Mock data
      activeIssues: Math.floor(Math.random() * 8) + 2, // Mock data
      systemHealth: 'healthy',
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}