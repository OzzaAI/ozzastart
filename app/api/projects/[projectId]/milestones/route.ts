import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { milestones, projects, ozza_account_members, user, project_activity_log } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, or, desc, asc, count, like, inArray } from 'drizzle-orm';

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

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId } = params;
    const url = new URL(request.url);

    // Check if project exists and user has access
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = await checkAgencyAccess(userId, project[0].agency_account_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    // Query parameters
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = url.searchParams.get('sort_order') || 'asc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;

    // Build base query conditions
    let whereConditions = [eq(milestones.project_id, projectId)];

    // Add additional filters
    if (status) {
      whereConditions.push(eq(milestones.status, status));
    }
    if (search) {
      whereConditions.push(
        or(
          like(milestones.name, `%${search}%`),
          like(milestones.description, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(milestones)
      .where(whereClause);

    const totalCountValue = totalCountResult[0]?.count || 0;

    // Get milestones with pagination
    const sortColumn = sortBy === 'name' ? milestones.name : 
                      sortBy === 'status' ? milestones.status :
                      sortBy === 'due_date' ? milestones.due_date :
                      milestones.created_at;

    const milestonesResult = await db
      .select()
      .from(milestones)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      milestones: milestonesResult,
      totalCount: totalCountValue,
      page,
      limit,
      totalPages: Math.ceil(totalCountValue / limit),
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId } = params;
    const body = await request.json();

    // Check if project exists and user has access
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const hasAccess = await checkAgencyAccess(userId, project[0].agency_account_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    const {
      name,
      description,
      due_date,
      status = 'pending',
      order_index = 0,
      completion_percentage = 0,
      requires_client_approval = false,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        error: 'Missing required field: name'
      }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const milestoneId = crypto.randomUUID();

    const milestoneData = {
      id: milestoneId,
      project_id: projectId,
      name,
      description,
      due_date: due_date ? new Date(due_date) : null,
      status,
      order_index,
      completion_percentage,
      requires_client_approval,
    };

    await db.insert(milestones).values(milestoneData);

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'created',
      'milestone',
      milestoneId,
      { milestone_name: name },
      null,
      milestoneData
    );

    return NextResponse.json({
      milestone: milestoneData,
      message: 'Milestone created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}