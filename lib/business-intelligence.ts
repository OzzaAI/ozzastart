import { db } from '@/db/drizzle';
import { projects, tasks } from '@/db/schema';
import { eq, and, count, sum, lte, between } from 'drizzle-orm';
// Simple date utilities (avoiding date-fns dependency)
function startOfWeek(date: Date): Date {
  const diff = date.getDate() - date.getDay();
  return new Date(date.setDate(diff));
}

function endOfWeek(date: Date): Date {
  const diff = date.getDate() - date.getDay() + 6;
  return new Date(date.setDate(diff));
}

export interface BusinessMetrics {
  projectCompletionRate: number;
  averageProjectDuration: number;
  activeProjectsCount: number;
  overDueProjectsCount: number;
  teamProductivity: {
    tasksCompletedThisWeek: number;
    averageTaskCompletionTime: number;
  };
  revenueMetrics: {
    totalProjectValue: number;
    completedProjectValue: number;
    pendingProjectValue: number;
  };
}

export async function getBusinessMetrics(accountId: string, userRole: string): Promise<BusinessMetrics> {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  
  // Get projects based on user role
  const projectsQuery = userRole === 'agency' 
    ? eq(projects.agency_account_id, accountId)
    : eq(projects.client_account_id, accountId);

  // Project completion rate
  const totalProjects = await db
    .select({ count: count() })
    .from(projects)
    .where(projectsQuery);

  const completedProjects = await db
    .select({ count: count() })
    .from(projects)
    .where(and(projectsQuery, eq(projects.status, 'completed')));

  const projectCompletionRate = totalProjects[0]?.count 
    ? (completedProjects[0]?.count || 0) / totalProjects[0].count * 100
    : 0;

  // Active and overdue projects
  const activeProjects = await db
    .select({ count: count() })
    .from(projects)
    .where(and(projectsQuery, eq(projects.status, 'active')));

  const overDueProjects = await db
    .select({ count: count() })
    .from(projects)
    .where(and(
      projectsQuery, 
      eq(projects.status, 'active'),
      lte(projects.due_date, now)
    ));

  // Tasks completed this week
  const tasksThisWeek = await db
    .select({ count: count() })
    .from(tasks)
    .innerJoin(projects, eq(tasks.project_id, projects.id))
    .where(and(
      projectsQuery,
      eq(tasks.status, 'completed'),
      between(tasks.completed_at, weekStart, weekEnd)
    ));

  // Revenue metrics (sum of project budgets)
  const allProjectBudgets = await db
    .select({
      total: sum(projects.budget),
      status: projects.status
    })
    .from(projects)
    .where(projectsQuery)
    .groupBy(projects.status);

  const totalProjectValue = allProjectBudgets.reduce((acc, curr) => acc + (curr.total || 0), 0) / 100; // Convert cents to dollars
  const completedProjectValue = (allProjectBudgets.find(p => p.status === 'completed')?.total || 0) / 100;
  const pendingProjectValue = totalProjectValue - completedProjectValue;

  return {
    projectCompletionRate: Math.round(projectCompletionRate),
    averageProjectDuration: 0, // TODO: Calculate based on start/end dates
    activeProjectsCount: activeProjects[0]?.count || 0,
    overDueProjectsCount: overDueProjects[0]?.count || 0,
    teamProductivity: {
      tasksCompletedThisWeek: tasksThisWeek[0]?.count || 0,
      averageTaskCompletionTime: 0, // TODO: Calculate based on task duration
    },
    revenueMetrics: {
      totalProjectValue,
      completedProjectValue,
      pendingProjectValue
    }
  };
}

export function generateBusinessInsights(metrics: BusinessMetrics, businessData: { type: string; totalProjects?: number; [key: string]: unknown }): string[] {
  const insights: string[] = [];

  // Project completion insights
  if (metrics.projectCompletionRate < 70) {
    insights.push(`⚠️ Your project completion rate is ${metrics.projectCompletionRate}%. Consider reviewing project scoping and timelines.`);
  } else if (metrics.projectCompletionRate > 90) {
    insights.push(`🎉 Excellent project completion rate of ${metrics.projectCompletionRate}%! Your team is performing exceptionally well.`);
  }

  // Overdue projects
  if (metrics.overDueProjectsCount > 0) {
    insights.push(`📅 You have ${metrics.overDueProjectsCount} overdue project(s). Consider reallocating resources or adjusting timelines.`);
  }

  // Revenue insights
  if (metrics.revenueMetrics.pendingProjectValue > metrics.revenueMetrics.completedProjectValue) {
    insights.push(`💰 You have $${metrics.revenueMetrics.pendingProjectValue.toLocaleString()} in pending project value - great pipeline!`);
  }

  // Team productivity
  if (metrics.teamProductivity.tasksCompletedThisWeek < 5) {
    insights.push(`📊 Task completion is slower this week (${metrics.teamProductivity.tasksCompletedThisWeek} tasks). Consider checking team capacity.`);
  }

  // Role-specific insights
  if (businessData.type === 'agency') {
    if (businessData.totalProjects > 0 && businessData.totalProjects < 5) {
      insights.push(`🚀 You're managing ${businessData.totalProjects} projects. Consider taking on more clients to scale your agency.`);
    }
  }

  return insights;
}

export function formatBusinessSummary(businessData: { type: string; agencyName?: string; clientName?: string; accounts?: number; totalProjects?: number; completedProjects?: number; activeProjects?: number; [key: string]: unknown }, metrics: BusinessMetrics): string {
  const summary = [];

  if (businessData.type === 'coach') {
    summary.push(`You're managing ${businessData.accounts} agencies with ${businessData.totalProjects} total projects.`);
  } else if (businessData.type === 'agency') {
    summary.push(`Your agency "${businessData.agencyName}" has:`);
    summary.push(`• ${businessData.totalProjects} total projects`);
    summary.push(`• ${businessData.completedProjects} completed projects`);
    summary.push(`• ${businessData.activeProjects} active projects`);
    summary.push(`• ${metrics.projectCompletionRate}% completion rate`);
  } else if (businessData.type === 'client') {
    summary.push(`Your company "${businessData.clientName}" has:`);
    summary.push(`• ${businessData.totalProjects} total projects`);
    summary.push(`• ${businessData.activeProjects} active projects`);
    summary.push(`• ${businessData.completedProjects} completed projects`);
  }

  return summary.join('\n');
}