import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_account_members, client_invitations, agency_invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isTokenValid, markTokenUsed } from '@/db/invite-tokens';

export async function POST(request: NextRequest) {
  try {
    const { email, role, inviteToken, clientInviteToken, agencyInviteToken } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Find the user by email
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = existingUser[0].id;

    // Update the user's role
    await db.update(user)
      .set({ role: role })
      .where(eq(user.id, userId));

    // Mark coach invite token as used if provided
    if (role === 'coach' && inviteToken) {
      markTokenUsed(inviteToken);
    }

    // If it's a client signup with an invite, associate the client with the correct agency's account
    if (role === 'client' && clientInviteToken) {
      // Find the account ID from the client invitation using the token
      const invitation = await db.select()
        .from(client_invitations)
        .where(eq(client_invitations.token, clientInviteToken))
        .limit(1);

      if (invitation.length > 0) {
        const agencyAccountId = invitation[0].account_id;
        
        // Associate the new client user with this agency account
        await db.insert(ozza_account_members).values({
          user_id: userId,
          account_id: agencyAccountId,
          role: 'client',
        });
      }
    }

    // If it's an agency signup with an invite, associate the agency with the correct coach's account
    if (role === 'agency' && agencyInviteToken) {
      // Find the coach_account_id from the agency invitation using the token
      const invitation = await db.select()
        .from(agency_invitations)
        .where(eq(agency_invitations.token, agencyInviteToken))
        .limit(1);

      if (invitation.length > 0) {
        const coachAccountId = invitation[0].coach_account_id;
        
        // Associate the new agency user with this coach's account
        await db.insert(ozza_account_members).values({
          user_id: userId,
          account_id: coachAccountId,
          role: 'agency',
        });
      }
    }

    return NextResponse.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error setting user role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}