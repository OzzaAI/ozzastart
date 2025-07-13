import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_accounts, ozza_account_members } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

type PrivacySettings = {
  blindMode: boolean;
  shareClientNames: boolean;
  shareRevenue: boolean;
  shareMetrics: boolean;
  shareConversions: boolean;
  allowCoachAccess: boolean;
  allowCoachChat: boolean;
  shareIssues: boolean;
};

export async function GET() {
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

    // Check if user is part of an agency
    const membershipInfo = await db
      .select({
        accountId: ozza_account_members.account_id,
        role: ozza_account_members.role,
      })
      .from(ozza_account_members)
      .where(eq(ozza_account_members.user_id, userId))
      .limit(1);

    if (membershipInfo.length === 0) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    // For now, return default privacy settings
    // In production, these would be stored in the database
    const defaultSettings: PrivacySettings = {
      blindMode: true,
      shareClientNames: false,
      shareRevenue: true,
      shareMetrics: true,
      shareConversions: true,
      allowCoachAccess: false,
      allowCoachChat: true,
      shareIssues: true,
    };

    return NextResponse.json({
      settings: defaultSettings,
      accountId: membershipInfo[0].accountId,
    });

  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const body = await request.json();
    const { settings } = body as { settings: PrivacySettings };

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    // Get user info and check agency membership
    const userInfo = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    if (userInfo.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const membershipInfo = await db
      .select({
        accountId: ozza_account_members.account_id,
        role: ozza_account_members.role,
      })
      .from(ozza_account_members)
      .where(eq(ozza_account_members.user_id, userId))
      .limit(1);

    if (membershipInfo.length === 0) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    // Check if user has permission to modify settings (owner/admin)
    if (!['owner', 'admin'].includes(membershipInfo[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate business rules
    if (settings.allowCoachAccess && settings.blindMode) {
      return NextResponse.json({ 
        error: 'Cannot enable coach access while blind mode is active' 
      }, { status: 400 });
    }

    // In production, save settings to database
    // For now, we'll just return success
    console.log('Privacy settings updated for account:', membershipInfo[0].accountId, settings);

    return NextResponse.json({
      success: true,
      settings,
      message: 'Privacy settings updated successfully',
    });

  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}