import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user_profiles } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const { userId, email, phoneNumber, address, metadata } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields: userId or email' }, { status: 400 });
    }

    const [newUserProfile] = await db.insert(user_profiles).values({
      user_id: userId,
      phone_number: phoneNumber,
      address: address,
      metadata: metadata,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();

    if (!newUserProfile) {
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, userProfile: newUserProfile }, { status: 200 });
  } catch (error) {
    console.error('Error in create-user-profile API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}