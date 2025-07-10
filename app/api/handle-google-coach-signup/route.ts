import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inviteToken = searchParams.get('invite');
  const inviteEmail = searchParams.get('email');

  try {
    const sessionResult = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionResult?.session?.userId) {
      // If no session, redirect to login (shouldn't happen if Google auth worked)
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const userId = sessionResult.session.userId;

    if (inviteToken && inviteEmail) {
      // Verify the invite token server-side
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/verify-invite?token=${inviteToken}&email=${encodeURIComponent(inviteEmail)}`);
      const verifyData = await verifyResponse.json();

      if (verifyData.valid && verifyData.role === 'coach') {
        // Update user role to coach
        await db.update(user).set({ role: 'coach' }).where(eq(user.id, userId));
        // Optionally, mark invite as used here if you have that API
      }
    }

    // Redirect to coach dashboard
    return NextResponse.redirect(new URL('/dashboard/coach', request.url));

  } catch (error) {
    console.error('Error in handle-google-coach-signup:', error);
    return NextResponse.redirect(new URL('/login?error=google_coach_signup_failed', request.url));
  }
}
