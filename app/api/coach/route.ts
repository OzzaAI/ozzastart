import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_accounts, ozza_account_members } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;

    // Get user info
    const userInfo = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    if (userInfo.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = userInfo[0];

    // Check if user should have coach access based on their role (admin can also access)
    const isCoach = currentUser.role === 'coach' || currentUser.role === 'admin';

    if (!isCoach) {
      return NextResponse.json({ error: 'Access denied - Coach role required' }, { status: 403 });
    }

    // Get user's account memberships (may be empty for new coaches)
    let userMemberships = [];
    let assignedAgencies = [];
    
    try {
      userMemberships = await db
        .select({
          role: ozza_account_members.role,
          accountId: ozza_account_members.account_id,
          accountName: ozza_accounts.name,
          createdAt: ozza_accounts.created_at,
          logoUrl: ozza_accounts.logo_url,
          primaryColor: ozza_accounts.primary_color,
          secondaryColor: ozza_accounts.secondary_color,
        })
        .from(ozza_account_members)
        .leftJoin(ozza_accounts, eq(ozza_account_members.account_id, ozza_accounts.id))
        .where(eq(ozza_account_members.user_id, userId));

      assignedAgencies = (userMemberships || [])
        .filter((member) => member.accountId) // Only include valid accounts
        .map((member) => ({
          id: member.accountId,
          account_name: member.accountName,
          created_at: member.createdAt,
          logo_url: member.logoUrl,
          primary_color: member.primaryColor,
          secondary_color: member.secondaryColor,
          plan_id: 'basic', // TODO: Add plan tracking
        }));
    } catch (error) {
      console.warn('Error fetching account memberships:', error);
      // Continue with empty agencies array for new coaches
    }

    const coachMembership = (userMemberships || []).find((member) => member.role === 'coach');

    return NextResponse.json({
      isCoach: true,
      user: {
        id: userId,
        email: currentUser.email,
        role: currentUser.role,
      },
      account: coachMembership?.accountId || null,
      assignedAgencies: assignedAgencies,
      agencyCount: assignedAgencies.length,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching coach data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}