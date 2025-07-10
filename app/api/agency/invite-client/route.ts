import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, client_invitations, ozza_account_members } from '@/db/schema';
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
      return NextResponse.json({ error: 'Client name and email are required' }, { status: 400 });
    }

    // Check if user with this email already exists
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Find the account ID associated with the current agency user
    const agencyAccount = await db.select({
      accountId: ozza_account_members.account_id
    })
    .from(ozza_account_members)
    .where(eq(ozza_account_members.user_id, currentUser.id))
    .limit(1);

    if (agencyAccount.length === 0) {
      return NextResponse.json({ error: 'Agency not associated with an account' }, { status: 403 });
    }

    const accountId = agencyAccount[0].accountId;

    // Generate a unique token for the invitation
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days

    // Insert the invitation into the client_invitations table
    await db.insert(client_invitations).values({
      token,
      client_name: name,
      client_email: email,
      account_id: accountId,
      expires_at: expiresAt,
      status: 'pending',
    });

    // In a real application, you would send an email with this link
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?client_invite_token=${token}&email=${encodeURIComponent(email)}`;

    console.log(`Client invite generated for ${email}: ${inviteLink}`);

    return NextResponse.json({
      message: 'Client invitation sent successfully',
      email,
      inviteLink,
    });
  } catch (error) {
    console.error('Error inviting client:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
