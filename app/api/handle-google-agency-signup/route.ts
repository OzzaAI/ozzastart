import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db/drizzle';
import { user, ozza_accounts, ozza_account_members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agencyInviteToken = searchParams.get('agency_invite_token');
  const inviteEmail = searchParams.get('email');
  const coachAccountId = searchParams.get('coach_account_id');

  try {
    const sessionResult = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionResult?.session?.userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const userId = sessionResult.session.userId;

    if (agencyInviteToken && inviteEmail && coachAccountId) {
      // Verify the agency invite token server-side
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/verify-agency-invite?token=${agencyInviteToken}&email=${encodeURIComponent(inviteEmail)}`);
      const verifyData = await verifyResponse.json();

      if (verifyData.valid && verifyData.role === 'agency') {
        // Update user role to agency
        await db.update(user).set({ role: 'agency' }).where(eq(user.id, userId));

        // Create a new agency account
        const newAgencyId = nanoid(16); // Generate a unique ID for the new agency
        const newAgencyName = `${verifyData.agencyName || 'New Agency'} - ${nanoid(4)}`; // Use provided name or a placeholder

        await db.insert(ozza_accounts).values({
          id: newAgencyId,
          name: newAgencyName,
          owner_id: userId,
          // Add other default values for ozza_accounts as needed
        });

        // Link the user to the new agency account as an admin
        await db.insert(ozza_account_members).values({
          user_id: userId,
          account_id: newAgencyId,
          role: 'admin',
        });

        // Optionally, mark agency invite as used here if you have that API
        // await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mark-agency-invite-used`, { method: 'POST', body: JSON.stringify({ token: agencyInviteToken }) });
      }
    }

    // Redirect to agency dashboard
    return NextResponse.redirect(new URL('/dashboard/agency', request.url));

  } catch (error) {
    console.error('Error in handle-google-agency-signup:', error);
    return NextResponse.redirect(new URL('/login?error=google_agency_signup_failed', request.url));
  }
}
