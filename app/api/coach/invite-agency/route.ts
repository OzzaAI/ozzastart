import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_account_members, ozza_accounts, agency_invitations } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const result = await auth.api.getSession({
      headers: headers(),
    });

    if (!result.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = result.session.user;
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Agency name and email are required' }, { status: 400 });
    }

    // Check if user with this email already exists
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Find the account ID associated with the current coach (who is inviting)
    const coachAccount = await db.select({
      accountId: ozza_accounts.id
    })
    .from(ozza_accounts)
    .where(eq(ozza_accounts.owner_id, currentUser.id))
    .limit(1);

    if (coachAccount.length === 0) {
      return NextResponse.json({ error: 'Coach not associated with an account' }, { status: 403 });
    }

    const coachAccountId = coachAccount[0].accountId;

    // Generate a unique token for the invitation
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days

    // Insert the invitation into the agency_invitations table
    await db.insert(agency_invitations).values({
      token,
      agency_name: name,
      agency_email: email,
      coach_account_id: coachAccountId,
      expires_at: expiresAt,
      status: 'pending',
    });

    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?agency_invite_token=${token}&email=${encodeURIComponent(email)}&coach_account_id=${coachAccountId}`;

    console.log(`Agency invite generated for ${email}: ${inviteLink}`);

    return NextResponse.json({
      message: 'Agency invitation sent successfully',
      email,
      inviteLink,
    });
  } catch (error) {
    console.error('Error inviting agency:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
