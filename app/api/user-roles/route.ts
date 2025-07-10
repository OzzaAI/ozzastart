import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { ozza_account_members, ozza_accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const userMemberships = await db.select({
      role: ozza_account_members.role,
      accountId: ozza_account_members.account_id,
      accountName: ozza_accounts.account_name,
    })
    .from(ozza_account_members)
    .leftJoin(ozza_accounts, eq(ozza_account_members.account_id, ozza_accounts.id))
    .where(eq(ozza_account_members.user_id, userId));

    if (!userMemberships || userMemberships.length === 0) {
      return NextResponse.json({ error: 'No account memberships found for this user' }, { status: 404 });
    }

    return NextResponse.json({ success: true, memberships: userMemberships }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}