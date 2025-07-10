import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { ozza_accounts, ozza_account_members } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const { userEmail, userId, coachId, agencyName } = await request.json();

    if (!userEmail || !userId || !coachId || !agencyName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a new agency account
    const [newAgency] = await db.insert(ozza_accounts).values({
      name: agencyName,
      owner_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();

    if (!newAgency) {
      return NextResponse.json({ error: 'Failed to create agency account' }, { status: 500 });
    }

    // Link the coach user to the new agency as an owner
    await db.insert(ozza_account_members).values({
      user_id: userId,
      account_id: newAgency.id,
      role: 'owner',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Optionally, update the coach's user metadata to link to the agency
    // This would typically be done via better-auth's admin API if available
    // For now, we'll assume the user_metadata was set during signup

    return NextResponse.json({
      success: true,
      message: 'Agency account created and linked successfully',
      agencyId: newAgency.id,
      redirectUrl: '/dashboard', // Redirect to the main dashboard after successful setup
    });

  } catch (error) {
    console.error('Error in create-agency-for-coach API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
