import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_account_members } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, inArray } from 'drizzle-orm';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await auth.api.getSession({
      headers: headers(),
    });

    if (!result.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = result.session.user;

    // Find the account ID associated with the current agency user
    const agencyAccount = await db.select({
      accountId: ozza_account_members.account_id
    })
    .from(ozza_account_members)
    .where(eq(ozza_account_members.user_id, currentUser.id))
    .limit(1);

    if (agencyAccount.length === 0) {
      return NextResponse.json({ clients: [] });
    }

    const accountId = agencyAccount[0].accountId;

    // Find all members of this agency account who have the 'client' role
    const clients = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .leftJoin(ozza_account_members, eq(user.id, ozza_account_members.user_id))
    .where(and(
      eq(ozza_account_members.account_id, accountId),
      eq(ozza_account_members.role, 'client')
    ));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching agency clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
