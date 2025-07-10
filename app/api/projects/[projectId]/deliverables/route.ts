import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { deliverables, projects, ozza_account_members, user, project_activity_log } from '@/db/schema';
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
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;

    // Build base query conditions
    let whereConditions = [eq(deliverables.project_id, projectId)];

    // Add additional filters
    if (status) {
      whereConditions.push(eq(deliverables.status, status));
    }
    if (type) {
      whereConditions.push(eq(deliverables.type, type));
    }
    if (search) {
      whereConditions.push(
        or(
          like(deliverables.name, `%${search}%`),
          like(deliverables.description, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(deliverables)
      .where(whereClause);

    const totalCountValue = totalCountResult[0]?.count || 0;

    // Get deliverables with pagination
    const sortColumn = sortBy === 'name' ? deliverables.name : 
                      sortBy === 'status' ? deliverables.status :
                      sortBy === 'due_date' ? deliverables.due_date :
                      deliverables.created_at;

    const deliverablesResult = await db
      .select()
      .from(deliverables)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      deliverables: deliverablesResult,
      totalCount: totalCountValue,
      page,
      limit,
      totalPages: Math.ceil(totalCountValue / limit),
    });
  } catch (error) {
    console.error('Error fetching deliverables:', error);
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
      milestone_id,
      task_id,
      type,
      status = 'pending',
      file_url,
      file_name,
      file_size,
      file_type,
      requires_client_approval = true,
      due_date,
      version = 1,
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({
        error: 'Missing required fields: name, type'
      }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['pending', 'submitted', 'approved', 'rejected', 'revision-needed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const deliverableId = crypto.randomUUID();

    const deliverableData = {
      id: deliverableId,
      project_id: projectId,
      milestone_id,
      task_id,
      name,
      description,
      type,
      status,
      file_url,
      file_name,
      file_size,
      file_type,
      requires_client_approval,
      submitted_at: new Date(),
      submitted_by: userId,
      due_date: due_date ? new Date(due_date) : null,
      version,
    };

    await db.insert(deliverables).values(deliverableData);

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'created',
      'deliverable',
      deliverableId,
      { deliverable_name: name },
      null,
      deliverableData
    );

    return NextResponse.json({
      deliverable: deliverableData,
      message: 'Deliverable created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating deliverable:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}