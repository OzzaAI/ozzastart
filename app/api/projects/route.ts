import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { projects, ozza_account_members, user, project_activity_log } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, or, desc, asc, count, like, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// Helper function to check if user has access to agency
async function checkAgencyAccess(userId: string, agencyId: string) {
  const membership = await db
    .select()
    .from(ozza_account_members)
    .where(
      and(
        eq(ozza_account_members.user_id, userId),
        eq(ozza_account_members.account_id, agencyId)
      )
    )
    .limit(1);

  return membership.length > 0;
}

// Helper function to log project activity
async function logProjectActivity(
  projectId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: any,
  oldValues?: any,
  newValues?: any
) {
  await db.insert(project_activity_log).values({
    project_id: projectId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    old_values: oldValues,
    new_values: newValues,
  });
}

export async function GET(request: Request) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const url = new URL(request.url);
    
    // Query parameters
    const agencyId = url.searchParams.get('agency_id');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;

    // Build base query conditions
    let whereConditions = [];

    // Check user access to agency or get all accessible agencies
    if (agencyId) {
      const hasAccess = await checkAgencyAccess(userId, agencyId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this agency' }, { status: 403 });
      }
      whereConditions.push(eq(projects.agency_account_id, agencyId));
    } else {
      // Get all agencies user has access to
      const userMemberships = await db
        .select({ account_id: ozza_account_members.account_id })
        .from(ozza_account_members)
        .where(eq(ozza_account_members.user_id, userId));

      const accessibleAgencyIds = (userMemberships || []).map(m => m.account_id);
      
      if (accessibleAgencyIds.length === 0) {
        return NextResponse.json({ projects: [], totalCount: 0, page, limit });
      }

      whereConditions.push(inArray(projects.agency_account_id, accessibleAgencyIds));
    }

    // Add additional filters
    if (status) {
      whereConditions.push(eq(projects.status, status));
    }
    if (priority) {
      whereConditions.push(eq(projects.priority, priority));
    }
    if (search) {
      whereConditions.push(
        or(
          like(projects.name, `%${search}%`),
          like(projects.description, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(projects)
      .where(whereClause);

    const totalCountValue = totalCountResult[0]?.count || 0;

    // Get projects with pagination
    const sortColumn = sortBy === 'name' ? projects.name : 
                      sortBy === 'status' ? projects.status :
                      sortBy === 'priority' ? projects.priority :
                      sortBy === 'due_date' ? projects.due_date :
                      projects.created_at;

    const projectsResult = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        priority: projects.priority,
        budget: projects.budget,
        currency: projects.currency,
        start_date: projects.start_date,
        due_date: projects.due_date,
        completed_at: projects.completed_at,
        agency_account_id: projects.agency_account_id,
        client_account_id: projects.client_account_id,
        client_user_id: projects.client_user_id,
        project_manager_id: projects.project_manager_id,
        template_id: projects.template_id,
        metadata: projects.metadata,
        created_at: projects.created_at,
        updated_at: projects.updated_at,
        project_manager_name: user.name,
        project_manager_email: user.email,
      })
      .from(projects)
      .leftJoin(user, eq(projects.project_manager_id, user.id))
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      projects: projectsResult,
      totalCount: totalCountValue,
      page,
      limit,
      totalPages: Math.ceil(totalCountValue / limit),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const body = await request.json();

    const {
      name,
      description,
      status = 'planning',
      priority = 'medium',
      budget,
      currency = 'USD',
      start_date,
      due_date,
      agency_account_id,
      client_account_id,
      client_user_id,
      project_manager_id,
      template_id,
      metadata,
    } = body;

    // Validate required fields
    if (!name || !agency_account_id || !project_manager_id) {
      return NextResponse.json({
        error: 'Missing required fields: name, agency_account_id, project_manager_id'
      }, { status: 400 });
    }

    // Check if user has access to the agency
    const hasAccess = await checkAgencyAccess(userId, agency_account_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this agency' }, { status: 403 });
    }

    // Validate project manager exists and has access to agency
    const projectManagerAccess = await checkAgencyAccess(project_manager_id, agency_account_id);
    if (!projectManagerAccess) {
      return NextResponse.json({ 
        error: 'Project manager does not have access to this agency' 
      }, { status: 400 });
    }

    // Validate status and priority values
    const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    // Create project
    const projectId = crypto.randomUUID();
    
    const projectData = {
      id: projectId,
      name,
      description,
      status,
      priority,
      budget,
      currency,
      start_date: start_date ? new Date(start_date) : null,
      due_date: due_date ? new Date(due_date) : null,
      agency_account_id,
      client_account_id,
      client_user_id,
      project_manager_id,
      template_id,
      metadata,
    };

    await db.insert(projects).values(projectData);

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'created',
      'project',
      projectId,
      { created_by: userId },
      null,
      projectData
    );

    // Fetch the created project with manager details
    const createdProject = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        priority: projects.priority,
        budget: projects.budget,
        currency: projects.currency,
        start_date: projects.start_date,
        due_date: projects.due_date,
        completed_at: projects.completed_at,
        agency_account_id: projects.agency_account_id,
        client_account_id: projects.client_account_id,
        client_user_id: projects.client_user_id,
        project_manager_id: projects.project_manager_id,
        template_id: projects.template_id,
        metadata: projects.metadata,
        created_at: projects.created_at,
        updated_at: projects.updated_at,
        project_manager_name: user.name,
        project_manager_email: user.email,
      })
      .from(projects)
      .leftJoin(user, eq(projects.project_manager_id, user.id))
      .where(eq(projects.id, projectId))
      .limit(1);

    return NextResponse.json({
      project: createdProject[0],
      message: 'Project created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}