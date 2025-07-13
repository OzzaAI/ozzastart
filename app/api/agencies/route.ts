import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { ozza_accounts, ozza_account_members } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { name, primaryColor, secondaryColor } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Agency name is required' }, { status: 400 });
    }

    // Create new agency account
    const agencyId = nanoid();

    await db.insert(ozza_accounts).values({
      id: agencyId,
      name: name,
      owner_id: userId,
      primary_color: primaryColor || '#3B82F6',
      secondary_color: secondaryColor || '#8B5CF6',
    });

    // Add user as agency admin/owner
    await db.insert(ozza_account_members).values({
      user_id: userId,
      account_id: agencyId,
      role: 'admin',
    });

    return NextResponse.json({
      id: agencyId,
      name: name,
      message: 'Agency created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating agency:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    // During build time, return empty agencies
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ agencies: [] });
    }

    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;

    // Get all agencies the user is associated with
    const agencies = await db
      .select({
        id: ozza_accounts.id,
        name: ozza_accounts.name,
        logo_url: ozza_accounts.logo_url,
        primary_color: ozza_accounts.primary_color,
        secondary_color: ozza_accounts.secondary_color,
        created_at: ozza_accounts.created_at,
        role: ozza_account_members.role,
      })
      .from(ozza_account_members)
      .innerJoin(ozza_accounts, eq(ozza_account_members.account_id, ozza_accounts.id))
      .where(eq(ozza_account_members.user_id, userId));

    // Ensure agencies is always an array
    const safeAgencies = Array.isArray(agencies) ? agencies : [];
    
    return NextResponse.json({ agencies: safeAgencies });

  } catch (error) {
    console.error('Error fetching agencies:', error);
    // Return empty agencies array instead of error during build
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ agencies: [] });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}