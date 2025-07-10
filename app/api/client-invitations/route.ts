import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { client_invitations, ozza_account_members } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { invitationToken, userId, email } = await request.json();

    if (!invitationToken || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const invitation = await db.query.client_invitations.findFirst({
      where: eq(client_invitations.token, invitationToken),
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 });
    }

    // Link the new user to the account from the invitation
    await db.insert(ozza_account_members).values({
      user_id: userId,
      account_id: invitation.account_id,
      role: 'client',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Update invitation status to accepted
    await db.update(client_invitations)
      .set({ status: 'accepted', updated_at: new Date() })
      .where(eq(client_invitations.id, invitation.id));

    return NextResponse.json({ success: true, message: 'Invitation accepted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error accepting client invitation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}