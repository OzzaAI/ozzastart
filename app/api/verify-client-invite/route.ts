import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { client_invitations } from '@/db/schema';
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
      .from(client_invitations)
      .where(and(
        eq(client_invitations.token, token),
        eq(client_invitations.client_email, email),
        eq(client_invitations.status, 'pending'),
        gte(client_invitations.expires_at, new Date())
      ))
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid, expired, or used invitation' }, { status: 400 });
    }

    return NextResponse.json({ valid: true, role: 'client', email: invitation[0].client_email });
  } catch (error) {
    console.error('Error verifying client invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
