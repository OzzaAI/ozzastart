import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function GET() {
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

    // Get all users
    const allUsers = await db.select({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }).from(user);

    const users = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role || 'client',
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown',
      lastLogin: 'Recently', // Mock data
      status: 'active' as const,
    }));

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}