import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { chat_sessions, agents, shares } from "@/db/schema";

// Calculate time ranges
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

// Extract metrics from session data
function extractMetricsFromSessions(sessions: any[]) {
  let totalTimeSaved = 0;
  let totalTasks = 0;
  let successfulSessions = 0;
  let totalDuration = 0;
  const taskTypes = new Map<string, number>();

  sessions.forEach(session => {
    const state = session.state;
    const metadata = session.metadata;

    // Extract time saved (estimate based on task complexity)
    if (state.mcpResults) {
      const taskCount = Object.keys(state.mcpResults).length;
      totalTasks += taskCount;

      // Estimate time saved per task type
      Object.values(state.mcpResults).forEach((result: any) => {
        if (result.status === 'completed') {
          const taskType = result.task || 'unknown';
          taskTypes.set(taskType, (taskTypes.get(taskType) || 0) + 1);
          
          // Estimate time saved based on task type
          let timeSaved = 5; // Default 5 minutes per task
          if (taskType.includes('email')) timeSaved = 10;
          if (taskType.includes('database')) timeSaved = 15;
          if (taskType.includes('report')) timeSaved = 30;
          if (taskType.includes('analysis')) timeSaved = 20;
          
          totalTimeSaved += timeSaved;
        }
      });
    }

    // Check if session was successful
    if (state.finalResponse && !state.errorMessage) {
      successfulSessions++;
    }

    // Estimate session duration (mock data)
    totalDuration += Math.random() * 10 + 5; // 5-15 minutes
  });

  return {
    totalTimeSaved,
    totalTasks,
    successfulSessions,
    avgDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
    taskTypes: Array.from(taskTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([task]) => task),
  };
}

// GET - Retrieve ROI metrics
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

    const timeRanges = getTimeRanges();

    // Fetch all user's chat sessions
    const allSessions = await db
      .select()
      .from(chat_sessions)
      .where(eq(chat_sessions.userId, session.user.id))
      .orderBy(desc(chat_sessions.updatedAt));

    // Fetch this week's sessions
    const thisWeekSessions = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.userId, session.user.id),
          gte(chat_sessions.updatedAt, timeRanges.thisWeekStart),
          lte(chat_sessions.updatedAt, timeRanges.thisWeekEnd)
        )
      );

    // Fetch last week's sessions
    const lastWeekSessions = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.userId, session.user.id),
          gte(chat_sessions.updatedAt, timeRanges.lastWeekStart),
          lte(chat_sessions.updatedAt, timeRanges.lastWeekEnd)
        )
      );

    // Fetch share data for viral tracking
    const allShares = await db
      .select()
      .from(shares)
      .where(eq(shares.userId, session.user.id))
      .orderBy(desc(shares.createdAt));

    const thisWeekShares = await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.userId, session.user.id),
          gte(shares.createdAt, timeRanges.thisWeekStart),
          lte(shares.createdAt, timeRanges.thisWeekEnd)
        )
      );

    const lastWeekShares = await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.userId, session.user.id),
          gte(shares.createdAt, timeRanges.lastWeekStart),
          lte(shares.createdAt, timeRanges.lastWeekEnd)
        )
      );

    // Extract metrics
    const allMetrics = extractMetricsFromSessions(allSessions);
    const thisWeekMetrics = extractMetricsFromSessions(thisWeekSessions);
    const lastWeekMetrics = extractMetricsFromSessions(lastWeekSessions);

    // Calculate share metrics
    const sharesByPlatform = allShares.reduce((acc, share) => {
      acc[share.platform] = (acc[share.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate trends
    const timeTrend = thisWeekMetrics.totalTimeSaved > lastWeekMetrics.totalTimeSaved ? "up" : 
                     thisWeekMetrics.totalTimeSaved < lastWeekMetrics.totalTimeSaved ? "down" : "stable";
    
    const taskTrend = thisWeekMetrics.totalTasks > lastWeekMetrics.totalTasks ? "up" : 
                      thisWeekMetrics.totalTasks < lastWeekMetrics.totalTasks ? "down" : "stable";

    const sharesTrend = thisWeekShares.length > lastWeekShares.length ? "up" : 
                       thisWeekShares.length < lastWeekShares.length ? "down" : "stable";

    // Calculate efficiency score (0-100)
    const successRate = allSessions.length > 0 ? 
      (allMetrics.successfulSessions / allSessions.length) * 100 : 0;
    
    const taskComplexityBonus = Math.min(allMetrics.taskTypes.length * 10, 30);
    const efficiencyScore = Math.min(Math.round(successRate + taskComplexityBonus), 100);

    // Calculate improvement (mock calculation)
    const improvement = allSessions.length > 5 ? 
      Math.random() * 20 + 5 : // 5-25% improvement for active users
      Math.random() * 10; // 0-10% for new users

    // Generate activity data for the past 7 days
    const activityData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const daySessions = thisWeekSessions.filter(s => {
        const sessionDate = new Date(s.updatedAt);
        return sessionDate.toDateString() === date.toDateString();
      });

      const dayMetrics = extractMetricsFromSessions(daySessions);
      
      activityData.push({
        date: days[date.getDay()],
        sessions: daySessions.length,
        timeSaved: dayMetrics.totalTimeSaved,
        tasksCompleted: dayMetrics.totalTasks,
      });
    }

    // Calculate viral reach potential (estimated based on shares)
    const viralReach = allShares.length * 50; // Estimate 50 potential views per share

    // Prepare response
    const roiMetrics = {
      timeSaved: {
        total: allMetrics.totalTimeSaved,
        thisWeek: thisWeekMetrics.totalTimeSaved,
        lastWeek: lastWeekMetrics.totalTimeSaved,
        trend: timeTrend,
      },
      tasksAutomated: {
        total: allMetrics.totalTasks,
        thisWeek: thisWeekMetrics.totalTasks,
        lastWeek: lastWeekMetrics.totalTasks,
        trend: taskTrend,
      },
      agentShares: {
        total: allShares.length,
        thisWeek: thisWeekShares.length,
        lastWeek: lastWeekShares.length,
        trend: sharesTrend,
        byPlatform: sharesByPlatform,
        viralReach: viralReach,
      },
      chatSessions: {
        total: allSessions.length,
        thisWeek: thisWeekSessions.length,
        avgDuration: Math.round(allMetrics.avgDuration * 10) / 10,
        successRate: Math.round(successRate),
      },
      efficiency: {
        score: efficiencyScore,
        improvement: Math.round(improvement * 10) / 10,
        topTasks: allMetrics.taskTypes.length > 0 ? allMetrics.taskTypes : [
          "Email automation",
          "Data analysis", 
          "Report generation"
        ],
      },
    };

    return NextResponse.json({
      success: true,
      metrics: roiMetrics,
      activity: activityData,
    });

  } catch (error) {
    console.error("ROI metrics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate ROI metrics",
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