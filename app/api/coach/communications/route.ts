import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_accounts, ozza_account_members } from '@/db/schema';
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

    // Check if user should have coach access based on their role (admin can also access)
    const isCoach = currentUser.role === 'coach' || currentUser.role === 'admin';

    if (!isCoach) {
      return NextResponse.json({ error: 'Access denied - Coach role required' }, { status: 403 });
    }

    // Get user's agency associations
    let userMemberships = [];
    
    try {
      userMemberships = await db
        .select({
          accountId: ozza_account_members.account_id,
          accountName: ozza_accounts.name,
          logoUrl: ozza_accounts.logo_url,
          primaryColor: ozza_accounts.primary_color,
        })
        .from(ozza_account_members)
        .leftJoin(ozza_accounts, eq(ozza_account_members.account_id, ozza_accounts.id))
        .where(eq(ozza_account_members.user_id, userId));
    } catch (error) {
      console.warn('Error fetching account memberships:', error);
    }

    // Mock agencies with communication data
    const agencies = userMemberships
      .filter((member) => member.accountId)
      .map((member) => ({
        id: member.accountId,
        name: member.accountName || 'Unnamed Agency',
        logo_url: member.logoUrl,
        primary_color: member.primaryColor,
        lastMessage: 'Thanks for the website template!',
        lastMessageTime: '2 hours ago',
        unreadCount: Math.floor(Math.random() * 3),
        privacyMode: Math.random() > 0.5 ? 'blind' : 'open' as 'blind' | 'open',
      }));

    // Mock conversations data
    const conversations: Record<string, any> = {};
    
    agencies.forEach(agency => {
      conversations[agency.id] = {
        agencyId: agency.id,
        privacySettings: {
          allowChat: true,
          blindMode: agency.privacyMode === 'blind',
        },
        messages: [
          {
            id: '1',
            senderId: agency.id,
            senderName: agency.name,
            senderRole: 'agency',
            content: `Hi! We're excited to work with you as our coach.`,
            timestamp: '2 days ago',
            type: 'text',
          },
          {
            id: '2',
            senderId: userId,
            senderName: 'Coach',
            senderRole: 'coach',
            content: `Welcome to the Ozza network! I'm here to help you succeed. Let me know if you need any guidance.`,
            timestamp: '2 days ago',
            type: 'text',
          },
          {
            id: '3',
            senderId: agency.id,
            senderName: agency.name,
            senderRole: 'agency',
            content: `Thanks for the website template! It's exactly what our client needed.`,
            timestamp: '2 hours ago',
            type: 'text',
          },
        ],
      };
    });

    return NextResponse.json({
      agencies,
      conversations,
    });

  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}