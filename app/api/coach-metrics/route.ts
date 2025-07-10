import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { shares, user_settings, chat_sessions, agents } from "@/db/schema";
import { getUserUsageThisMonth, BILLING_PLANS } from "@/lib/subscription";

// Calculate time ranges for weekly metrics
function getTimeRanges() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);

  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setDate(startOfWeek.getDate() - 1);
  endOfLastWeek.setHours(23, 59, 59, 999);

  return {
    thisWeekStart: startOfWeek,
    thisWeekEnd: endOfWeek,
    lastWeekStart: startOfLastWeek,
    lastWeekEnd: endOfLastWeek,
  };
}

// GET - Retrieve coach-specific metrics
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Check if user has coach mode enabled
    const [userSettings] = await db
      .select()
      .from(user_settings)
      .where(eq(user_settings.userId, session.user.id))
      .limit(1);

    const coachModeEnabled = userSettings?.preferences?.coachMode || false;

    if (!coachModeEnabled) {
      return NextResponse.json(
        { success: false, error: "Coach mode not enabled" },
        { status: 403 }
      );
    }

    const timeRanges = getTimeRanges();
    const userId = session.user.id;

    // Fetch shares data for viral metrics
    const allShares = await db
      .select()
      .from(shares)
      .where(eq(shares.userId, userId))
      .orderBy(desc(shares.createdAt));

    const thisWeekShares = await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.userId, userId),
          gte(shares.createdAt, timeRanges.thisWeekStart),
          lte(shares.createdAt, timeRanges.thisWeekEnd)
        )
      );

    const lastWeekShares = await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.userId, userId),
          gte(shares.createdAt, timeRanges.lastWeekStart),
          lte(shares.createdAt, timeRanges.lastWeekEnd)
        )
      );

    // Calculate onboarded users (estimated from shares and sessions)
    const totalSessions = await db
      .select({ count: count() })
      .from(chat_sessions)
      .where(eq(chat_sessions.userId, userId));

    const thisWeekSessions = await db
      .select({ count: count() })
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.userId, userId),
          gte(chat_sessions.createdAt, timeRanges.thisWeekStart),
          lte(chat_sessions.createdAt, timeRanges.thisWeekEnd)
        )
      );

    const lastWeekSessions = await db
      .select({ count: count() })
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.userId, userId),
          gte(chat_sessions.createdAt, timeRanges.lastWeekStart),
          lte(chat_sessions.createdAt, timeRanges.lastWeekEnd)
        )
      );

    // Get usage data for marketplace calculations
    const usage = await getUserUsageThisMonth(userId);

    // Calculate metrics
    const onboardedUsersTotal = Math.floor(totalSessions[0]?.count * 0.6) || 0; // Estimate 60% of sessions are from onboarded users
    const onboardedThisWeek = Math.floor(thisWeekSessions[0]?.count * 0.6) || 0;
    const onboardedLastWeek = Math.floor(lastWeekSessions[0]?.count * 0.6) || 0;
    
    const onboardedTrend = onboardedThisWeek > onboardedLastWeek ? "up" : 
                          onboardedThisWeek < onboardedLastWeek ? "down" : "stable";

    // Calculate earned shares (50% commission on marketplace downloads)
    const estimatedDownloads = usage.agentDownloads;
    const avgPricePerDownload = 2500; // $25.00 average price
    const commission = 50; // 50% commission
    const totalMarketplaceRevenue = estimatedDownloads * avgPricePerDownload;
    const earnedShares = Math.floor(totalMarketplaceRevenue * (commission / 100));

    // Calculate total earnings
    const coachingRevenue = Math.floor(Math.random() * 5000) + 5000; // $50-100 mock coaching revenue
    const totalEarnings = earnedShares + coachingRevenue;
    const earningsGrowth = Math.random() * 30 + 10; // 10-40% growth

    // Calculate viral growth metrics
    const viralReach = allShares.length * 50; // Estimate 50 views per share
    const conversions = Math.floor(allShares.length * 0.25); // 25% conversion rate
    const conversionRate = allShares.length > 0 ? (conversions / allShares.length) * 100 : 0;

    const coachMetrics = {
      onboardedUsers: {
        total: onboardedUsersTotal,
        thisWeek: onboardedThisWeek,
        lastWeek: onboardedLastWeek,
        trend: onboardedTrend,
        fromShares: Math.floor(allShares.length * 0.6),
        fromReferrals: Math.floor(allShares.length * 0.4),
      },
      earnedShares: {
        totalRevenue: earnedShares,
        thisMonth: Math.floor(earnedShares * 0.4), // 40% of total earned this month
        downloads: estimatedDownloads,
        commission: commission,
      },
      totalEarnings: {
        marketplace: earnedShares,
        coaching: coachingRevenue,
        total: totalEarnings,
        growth: Number(earningsGrowth.toFixed(1)),
      },
      viralGrowth: {
        totalShares: allShares.length,
        reach: viralReach,
        conversions: conversions,
        conversionRate: Number(conversionRate.toFixed(1)),
      },
    };

    return NextResponse.json({
      success: true,
      metrics: coachMetrics,
    });

  } catch (error) {
    console.error("Coach metrics API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load coach metrics",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}