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

    // Check if user should have coach access based on their role
    const isCoach = currentUser.role === 'coach' || currentUser.role === 'admin';

    if (!isCoach) {
      return NextResponse.json({ error: 'Access denied - Coach role required' }, { status: 403 });
    }

    // Get user's agency associations
    let userMemberships = [];
    
    try {
      userMemberships = await db
        .select({
          role: ozza_account_members.role,
          accountId: ozza_account_members.account_id,
          accountName: ozza_accounts.name,
          createdAt: ozza_accounts.created_at,
          logoUrl: ozza_accounts.logo_url,
          primaryColor: ozza_accounts.primary_color,
          secondaryColor: ozza_accounts.secondary_color,
        })
        .from(ozza_account_members)
        .leftJoin(ozza_accounts, eq(ozza_account_members.account_id, ozza_accounts.id))
        .where(eq(ozza_account_members.user_id, userId));
    } catch (error) {
      console.warn('Error fetching account memberships:', error);
    }

    // Mock aggregated analytics data for now
    // In production, this would query real client/website/revenue data
    const agencyMetrics = userMemberships
      .filter((member) => member.accountId)
      .map((member) => ({
        id: member.accountId,
        name: member.accountName || 'Unnamed Agency',
        status: Math.random() > 0.3 ? 'active' : Math.random() > 0.5 ? 'setup' : 'inactive',
        clientCount: Math.floor(Math.random() * 25) + 1,
        websitesBuilt: Math.floor(Math.random() * 50) + 5,
        conversionRate: Math.floor(Math.random() * 15) + 10,
        monthlyRevenue: Math.floor(Math.random() * 15000) + 2000,
        lastActivity: ['2 hours ago', '1 day ago', '3 days ago', '1 week ago'][Math.floor(Math.random() * 4)],
        issueCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
        plan: ['basic', 'pro', 'enterprise'][Math.floor(Math.random() * 3)],
        logo_url: member.logoUrl,
        primary_color: member.primaryColor,
      }));

    // Calculate aggregate metrics
    const aggregateMetrics = {
      totalAgencies: agencyMetrics.length,
      totalClients: agencyMetrics.reduce((sum, agency) => sum + agency.clientCount, 0),
      totalWebsites: agencyMetrics.reduce((sum, agency) => sum + agency.websitesBuilt, 0),
      avgConversionRate: agencyMetrics.length > 0 
        ? Math.round(agencyMetrics.reduce((sum, agency) => sum + agency.conversionRate, 0) / agencyMetrics.length)
        : 0,
      totalRevenue: agencyMetrics.reduce((sum, agency) => sum + agency.monthlyRevenue, 0),
      activeIssues: agencyMetrics.reduce((sum, agency) => sum + agency.issueCount, 0),
      completedProjects: agencyMetrics.reduce((sum, agency) => sum + agency.websitesBuilt, 0),
      pendingTasks: Math.floor(Math.random() * 12) + 3,
    };

    // Mock recent activity feed
    const recentActivity = agencyMetrics.length > 0 ? [
      {
        id: '1',
        type: 'client_added',
        agencyName: agencyMetrics[0]?.name || 'Sample Agency',
        description: 'added 2 new clients',
        timestamp: '2 hours ago',
      },
      {
        id: '2',
        type: 'website_published',
        agencyName: agencyMetrics[Math.floor(Math.random() * Math.max(1, agencyMetrics.length))]?.name || 'Sample Agency',
        description: 'published new website for Bakery Co.',
        timestamp: '5 hours ago',
      },
      {
        id: '3',
        type: 'revenue_milestone',
        agencyName: agencyMetrics[Math.floor(Math.random() * Math.max(1, agencyMetrics.length))]?.name || 'Sample Agency',
        description: 'reached $10k monthly revenue',
        timestamp: '1 day ago',
      },
      {
        id: '4',
        type: 'issue_reported',
        agencyName: agencyMetrics[Math.floor(Math.random() * Math.max(1, agencyMetrics.length))]?.name || 'Sample Agency',
        description: 'reported technical issue with forms',
        timestamp: '2 days ago',
      },
    ] : [];

    return NextResponse.json({
      isCoach: true,
      user: {
        id: userId,
        email: currentUser.email,
        role: currentUser.role,
      },
      agencyMetrics,
      aggregateMetrics,
      recentActivity,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching coach analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}