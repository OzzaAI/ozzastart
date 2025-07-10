import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { ozza_accounts, user, ozza_account_members } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { coach_id, agency_id } = await req.json();

  if (!coach_id || !agency_id) {
    return NextResponse.json({ error: 'Missing coach_id or agency_id' }, { status: 400 });
  }

  try {
    // Here you would typically have a table that links coaches and agencies.
    // For now, we'll just update the agency's account to have a `coach_id` field.
    // This assumes you have a `coach_id` column on your `accounts` table.

    // First, verify the coach exists (optional but recommended)
    const coach = await db.select().from(user).where(eq(user.id, coach_id)).limit(1);

    if (coach.length === 0) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Link agency to coach account through account membership
    await db.insert(ozza_account_members).values({
      user_id: agency_id,
      account_id: coach_id, // Assuming coach_id refers to coach's account
      role: 'agency',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to link agency to coach:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
