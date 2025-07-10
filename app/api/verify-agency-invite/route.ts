import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { agency_invitations } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json({ error: 'Token and email are required' }, { status: 400 });
    }

    const invitation = await db.select()
      .from(agency_invitations)
      .where(and(
        eq(agency_invitations.token, token),
        eq(agency_invitations.agency_email, email),
        eq(agency_invitations.status, 'pending'),
        gte(agency_invitations.expires_at, new Date())
      ))
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid, expired, or used invitation' }, { status: 400 });
    }

    return NextResponse.json({ valid: true, role: 'agency', email: invitation[0].agency_email, coachAccountId: invitation[0].coach_account_id });
  } catch (error) {
    console.error('Error verifying agency invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
