import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_account_members } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const result = await auth.api.getSession({
      headers: headers(),
    });

    if (!result.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = result.session.user;
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // In a real application, you would store this message in a database
    // and/or send a notification to the agency associated with this client.
    // For now, we'll just log it.

    // Find the agency account ID associated with the current client
    const clientAccountMember = await db.select({
      accountId: ozza_account_members.account_id
    })
    .from(ozza_account_members)
    .where(eq(ozza_account_members.user_id, currentUser.id))
    .limit(1);

    if (clientAccountMember.length === 0) {
      return NextResponse.json({ error: 'Client not associated with an agency' }, { status: 403 });
    }

    const agencyAccountId = clientAccountMember[0].accountId;

    console.log(`Message from client ${currentUser.email} (Account: ${agencyAccountId}): ${message}`);

    return NextResponse.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
