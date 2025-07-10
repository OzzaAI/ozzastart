import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { community_links, agency_invitations, ozza_accounts } from '@/db/schema';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      console.log('Unauthorized attempt to generate link');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    console.log(`Generating link for userId: ${userId}`);
    const { type } = await request.json();
    console.log(`Request type: ${type}`);

    if (type === 'agency') {
      // Fetch the coach's account ID
      const coachAccount = await db.select({ id: ozza_accounts.id }).from(ozza_accounts).where(eq(ozza_accounts.owner_id, userId)).limit(1);
      console.log('Coach Account:', coachAccount);

      if (coachAccount.length === 0) {
        console.log('Coach account not found for userId:', userId);
        return NextResponse.json({ error: 'Coach account not found' }, { status: 404 });
      }
      const coachAccountId = coachAccount[0].id;

      const { agencyName, agencyEmail } = await request.json();

      if (!agencyName || !agencyEmail) {
        return NextResponse.json({ error: 'Missing agencyName or agencyEmail' }, { status: 400 });
      }

      const agencyInviteToken = nanoid(20);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Link valid for 7 days

      await db.insert(agency_invitations).values({
        token: agencyInviteToken,
        agency_name: agencyName,
        agency_email: agencyEmail,
        coach_account_id: coachAccountId,
        expires_at: expiresAt,
        status: 'pending',
      });

      const communityLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?agency_invite_token=${agencyInviteToken}&coach_account_id=${coachAccountId}`;

      return NextResponse.json({
        communityLink,
        linkCode: agencyInviteToken,
      });
    } else {
      // Logic for coach community links with usage cap
      const communityLinkCode = nanoid(12);

      await db.insert(community_links).values({
        user_id: userId,
        link_code: communityLinkCode,
        max_uses: 100, // Set default max uses
        usage_count: 0, // Initialize usage count
      });

      const communityLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invite=${communityLinkCode}`;

      return NextResponse.json({
        communityLink,
        linkCode: communityLinkCode,
      });
    }
  } catch (error) {
    console.error('Error generating community link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}