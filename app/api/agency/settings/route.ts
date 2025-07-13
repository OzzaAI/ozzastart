import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { ozza_accounts, ozza_account_members } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // During build time, return empty response
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ settings: null });
    }

    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = result.session.user;

    // Find the account ID associated with the current agency user
    const agencyAccountMember = await db.select({
      accountId: ozza_account_members.account_id
    })
    .from(ozza_account_members)
    .where(eq(ozza_account_members.user_id, currentUser.id))
    .limit(1);

    if (agencyAccountMember.length === 0) {
      return NextResponse.json({ error: 'Agency not associated with an account' }, { status: 403 });
    }

    const accountId = agencyAccountMember[0].accountId;

    // Fetch the agency's account settings
    const agencySettings = await db.select({
      name: ozza_accounts.name,
      logo_url: ozza_accounts.logo_url,
      primary_color: ozza_accounts.primary_color,
      secondary_color: ozza_accounts.secondary_color,
    })
    .from(ozza_accounts)
    .where(eq(ozza_accounts.id, accountId))
    .limit(1);

    if (agencySettings.length === 0) {
      return NextResponse.json({ error: 'Agency account not found' }, { status: 404 });
    }

    return NextResponse.json(agencySettings[0]);
  } catch (error) {
    console.error('Error fetching agency settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await auth.api.getSession({
      headers: headers(),
    });

    if (!result.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = result.session.user;
    const { name, logo_url, primary_color, secondary_color } = await request.json();

    // Find the account ID associated with the current agency user
    const agencyAccountMember = await db.select({
      accountId: ozza_account_members.account_id
    })
    .from(ozza_account_members)
    .where(eq(ozza_account_members.user_id, currentUser.id))
    .limit(1);

    if (agencyAccountMember.length === 0) {
      return NextResponse.json({ error: 'Agency not associated with an account' }, { status: 403 });
    }

    const accountId = agencyAccountMember[0].accountId;

    // Update the agency's account settings
    await db.update(ozza_accounts)
      .set({
        name,
        logo_url,
        primary_color,
        secondary_color,
        updated_at: new Date(),
      })
      .where(eq(ozza_accounts.id, accountId));

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating agency settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
