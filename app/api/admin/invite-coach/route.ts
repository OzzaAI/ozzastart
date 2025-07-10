import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { createInviteToken } from '@/db/invite-tokens';

export async function POST(request: NextRequest) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;

    // Verify admin access
    const userInfo = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    if (userInfo.length === 0 || userInfo[0].role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create secure invite token
    const inviteToken = createInviteToken(email, 'coach');
    
    // Create secure invite link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/signup?invite=${inviteToken.token}&email=${encodeURIComponent(email)}`;

    console.log(`Coach invite generated for ${email}: ${inviteLink}`);

    return NextResponse.json({
      inviteLink,
      email,
      expiresIn: '7 days',
      expiresAt: inviteToken.expiresAt.toISOString(),
      message: 'Coach invite link generated successfully'
    });

  } catch (error) {
    console.error('Error generating coach invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}