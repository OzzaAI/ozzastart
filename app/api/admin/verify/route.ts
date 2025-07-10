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

    // Get user info
    const userInfo = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    
    if (userInfo.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = userInfo[0];

    // Check if user has admin role
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied - Admin privileges required. This portal is invisible to non-admin users.' 
      }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: currentUser.email,
        role: currentUser.role,
      },
      message: 'Admin access verified'
    });

  } catch (error) {
    console.error('Error verifying admin access:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}