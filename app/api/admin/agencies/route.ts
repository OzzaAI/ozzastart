import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_accounts, ozza_account_members } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

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

    // Get all agencies with coach info
    let agencies = [];
    
    try {
      const agencyData = await db
        .select({
          id: ozza_accounts.id,
          name: ozza_accounts.name,
          createdAt: ozza_accounts.created_at,
          coachUserId: ozza_account_members.user_id,
        })
        .from(ozza_accounts)
        .leftJoin(ozza_account_members, eq(ozza_accounts.id, ozza_account_members.account_id));

      // Get coach emails
      const agencyPromises = (agencyData || []).map(async (agency) => {
        let coachEmail = 'Unassigned';
        
        if (agency.coachUserId) {
          const coachInfo = await db
            .select({ email: user.email })
            .from(user)
            .where(eq(user.id, agency.coachUserId))
            .limit(1);
          
          if (coachInfo.length > 0) {
            coachEmail = coachInfo[0].email;
          }
        }

        return {
          id: agency.id,
          name: agency.name || 'Unnamed Agency',
          coachEmail,
          clientCount: Math.floor(Math.random() * 20) + 1, // Mock data
          revenue: Math.floor(Math.random() * 15000) + 2000, // Mock data
          status: Math.random() > 0.2 ? 'active' : Math.random() > 0.5 ? 'setup' : 'inactive',
          createdAt: agency.createdAt ? new Date(agency.createdAt).toLocaleDateString() : 'Unknown',
        };
      });

      agencies = await Promise.all(agencyPromises);
    } catch (error) {
      console.warn('Error fetching agencies:', error);
      // Return empty array if no agencies exist yet
    }

    return NextResponse.json({ agencies });

  } catch (error) {
    console.error('Error fetching agencies:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}