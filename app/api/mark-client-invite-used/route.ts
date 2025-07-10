import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { client_invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await db.update(client_invitations)
      .set({ status: 'used' })
      .where(eq(client_invitations.token, token));

    return NextResponse.json({ message: 'Client invitation marked as used' });
  } catch (error) {
    console.error('Error marking client invite as used:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
