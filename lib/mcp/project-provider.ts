import { db } from '@/db/drizzle';
import { projects, tasks, milestones, ozza_accounts } from '@/db/schema';
import { eq, and, desc, count, sum, avg, gte, lte, between } from 'drizzle-orm';

// Project-based revenue provider using your existing database
export interface ProjectRevenueData {
  totalRevenue: number;
  completedProjects: number;
  activeProjects: number;
  averageProjectValue: number;
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
    projectsCompleted: number;
  }>;
  topProjects: Array<{
    id: string;
    name: string;
    budget: number;
    status: string;
    completedAt?: Date;
  }>;
  revenueByStatus: Array<{
    status: string;
    amount: number;
    count: number;
  }>;
}

export class ProjectRevenueProvider {
  async getRevenue(accountId: string, userRole: string, startDate: Date, endDate: Date): Promise<ProjectRevenueData> {
    try {
      // Determine the correct query based on user role
      const projectsQuery = userRole === 'agency' 
        ? eq(projects.agency_account_id, accountId)
        : userRole === 'coach'
        ? eq(projects.client_account_id, accountId) // Coaches see all their agencies' projects
        : eq(projects.client_account_id, accountId);

      // Get all projects in date range
      const allProjects = await db
        .select()
        .from(projects)
        .where(and(
          projectsQuery,
          gte(projects.created_at, startDate),
          lte(projects.created_at, endDate)
        ))
        .orderBy(desc(projects.created_at));

      // Calculate total revenue from completed projects
      const completedProjectsData = await db
        .select({ 
          totalRevenue: sum(projects.budget),
          count: count()
        })
        .from(projects)
        .where(and(
          projectsQuery,
          eq(projects.status, 'completed'),
          gte(projects.updated_at, startDate),
          lte(projects.updated_at, endDate)
        ));

      // Get active projects
      const activeProjectsData = await db
        .select({ count: count() })
        .from(projects)
        .where(and(
          projectsQuery,
          eq(projects.status, 'active')
        ));

      // Calculate revenue by status
      const revenueByStatus = await db
        .select({
          status: projects.status,
          totalBudget: sum(projects.budget),
          count: count()
        })
        .from(projects)
        .where(and(
          projectsQuery,
          gte(projects.created_at, startDate),
          lte(projects.created_at, endDate)
        ))
        .groupBy(projects.status);

      const totalRevenue = (completedProjectsData[0]?.totalRevenue || 0) / 100; // Convert cents to dollars
      const completedProjects = completedProjectsData[0]?.count || 0;
      const activeProjects = activeProjectsData[0]?.count || 0;
      const averageProjectValue = completedProjects > 0 ? totalRevenue / completedProjects : 0;

      // Generate monthly breakdown (simplified)
      const monthlyBreakdown = await this.getMonthlyBreakdown(accountId, userRole, startDate, endDate);

      // Get top projects by budget
      const topProjects = allProjects
        .sort((a, b) => (b.budget || 0) - (a.budget || 0))
        .slice(0, 5)
        .map(project => ({
          id: project.id,
          name: project.name,
          budget: (project.budget || 0) / 100,
          status: project.status,
          completedAt: project.status === 'completed' ? project.updated_at : undefined
        }));

      const processedRevenueByStatus = revenueByStatus.map(status => ({
        status: status.status,
        amount: (status.totalBudget || 0) / 100,
        count: status.count
      }));

      return {
        totalRevenue,
        completedProjects,
        activeProjects,
        averageProjectValue,
        monthlyBreakdown,
        topProjects,
        revenueByStatus: processedRevenueByStatus
      };
    } catch (error) {
      console.error('Error fetching project revenue data:', error);
      return {
        totalRevenue: 0,
        completedProjects: 0,
        activeProjects: 0,
        averageProjectValue: 0,
        monthlyBreakdown: [],
        topProjects: [],
        revenueByStatus: []
      };
    }
  }

  private async getMonthlyBreakdown(accountId: string, userRole: string, startDate: Date, endDate: Date) {
    const projectsQuery = userRole === 'agency' 
      ? eq(projects.agency_account_id, accountId)
      : eq(projects.client_account_id, accountId);

    // Get projects completed in each month
    const monthlyData = await db
      .select({
        month: projects.updated_at,
        budget: projects.budget,
        status: projects.status
      })
      .from(projects)
      .where(and(
        projectsQuery,
        eq(projects.status, 'completed'),
        gte(projects.updated_at, startDate),
        lte(projects.updated_at, endDate)
      ));

    // Group by month
    const monthlyMap = new Map<string, { revenue: number; projectsCompleted: number }>();

    monthlyData.forEach(project => {
      const monthKey = project.month.toISOString().slice(0, 7); // YYYY-MM format
      const existing = monthlyMap.get(monthKey) || { revenue: 0, projectsCompleted: 0 };
      
      monthlyMap.set(monthKey, {
        revenue: existing.revenue + ((project.budget || 0) / 100),
        projectsCompleted: existing.projectsCompleted + 1
      });
    });

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      projectsCompleted: data.projectsCompleted
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getProjectMetrics(accountId: string, userRole: string) {
    try {
      const projectsQuery = userRole === 'agency' 
        ? eq(projects.agency_account_id, accountId)
        : eq(projects.client_account_id, accountId);

      // Get project counts by status
      const [totalProjects, completedProjects, activeProjects, overdueProjects] = await Promise.all([
        db.select({ count: count() }).from(projects).where(projectsQuery),
        db.select({ count: count() }).from(projects).where(and(projectsQuery, eq(projects.status, 'completed'))),
        db.select({ count: count() }).from(projects).where(and(projectsQuery, eq(projects.status, 'active'))),
        db.select({ count: count() }).from(projects).where(and(
          projectsQuery, 
          eq(projects.status, 'active'),
          lte(projects.due_date, new Date())
        ))
      ]);

      // Calculate completion rate
      const total = totalProjects[0]?.count || 0;
      const completed = completedProjects[0]?.count || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Get task completion metrics
      const tasksData = await db
        .select({
          status: tasks.status,
          count: count()
        })
        .from(tasks)
        .innerJoin(projects, eq(tasks.project_id, projects.id))
        .where(projectsQuery)
        .groupBy(tasks.status);

      const totalTasks = tasksData.reduce((sum, task) => sum + task.count, 0);
      const completedTasks = tasksData.find(task => task.status === 'completed')?.count || 0;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalProjects: total,
        completedProjects: completed,
        activeProjects: activeProjects[0]?.count || 0,
        overdueProjects: overdueProjects[0]?.count || 0,
        completionRate,
        taskCompletionRate,
        teamProductivity: taskCompletionRate // Use task completion as proxy for productivity
      };
    } catch (error) {
      console.error('Error fetching project metrics:', error);
      return {
        totalProjects: 0,
        completedProjects: 0,
        activeProjects: 0,
        overdueProjects: 0,
        completionRate: 0,
        taskCompletionRate: 0,
        teamProductivity: 0
      };
    }
  }
}

// Export singleton instance
export const projectRevenueProvider = new ProjectRevenueProvider();