import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_account_members, ozza_accounts } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    console.log('Fetching agencies for coach ID:', userId);

    // Find the account IDs where the current user is the owner (assuming coach owns an account)
    const agencies = await db.select({
      id: ozza_accounts.id,
      name: ozza_accounts.name,
      logo_url: ozza_accounts.logo_url,
      primary_color: ozza_accounts.primary_color,
      secondary_color: ozza_accounts.secondary_color,
      owner_id: ozza_accounts.owner_id,
      created_at: ozza_accounts.created_at,
      updated_at: ozza_accounts.updated_at,
    })
    .from(ozza_accounts)
    .where(eq(ozza_accounts.owner_id, userId));

    return NextResponse.json({ agencies });
  } catch (error) {
    console.error('Error fetching coach agencies:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
