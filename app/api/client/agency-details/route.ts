import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_account_members, ozza_accounts } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await auth.api.getSession({
      headers: headers(),
    });

    if (!result.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = result.session.user;

    // Find the account ID associated with the current client user
    const clientAccountMember = await db.select({
      accountId: ozza_account_members.account_id
    })
    .from(ozza_account_members)
    .where(eq(ozza_account_members.user_id, currentUser.id))
    .limit(1);

    if (clientAccountMember.length === 0) {
      return NextResponse.json({ error: 'Client not associated with an agency' }, { status: 403 });
    }

    const accountId = clientAccountMember[0].accountId;

    // Fetch the agency's account details
    const agencyDetails = await db.select({
      name: ozza_accounts.name,
      logo_url: ozza_accounts.logo_url,
      primary_color: ozza_accounts.primary_color,
      secondary_color: ozza_accounts.secondary_color,
    })
    .from(ozza_accounts)
    .where(eq(ozza_accounts.id, accountId))
    .limit(1);

    if (agencyDetails.length === 0) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    return NextResponse.json(agencyDetails[0]);
  } catch (error) {
    console.error('Error fetching client agency details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
