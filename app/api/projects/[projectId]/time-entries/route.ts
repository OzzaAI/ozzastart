import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { time_entries, projects, ozza_account_members, user, project_activity_log } from '@/db/schema';
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
    const task_id = url.searchParams.get('task_id');
    const user_id = url.searchParams.get('user_id');
    const billable = url.searchParams.get('billable');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort_by') || 'started_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;

    // Build base query conditions
    let whereConditions = [eq(time_entries.project_id, projectId)];

    // Add additional filters
    if (task_id) {
      whereConditions.push(eq(time_entries.task_id, task_id));
    }
    if (user_id) {
      whereConditions.push(eq(time_entries.user_id, user_id));
    }
    if (billable) {
      whereConditions.push(eq(time_entries.billable, billable === 'true'));
    }
    if (search) {
      whereConditions.push(
        like(time_entries.description, `%${search}%`)
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(time_entries)
      .where(whereClause);

    const totalCountValue = totalCountResult[0]?.count || 0;

    // Get time entries with pagination
    const sortColumn = sortBy === 'hours' ? time_entries.hours : 
                      sortBy === 'billable' ? time_entries.billable :
                      time_entries.started_at;

    const timeEntriesResult = await db
      .select({
        id: time_entries.id,
        project_id: time_entries.project_id,
        task_id: time_entries.task_id,
        user_id: time_entries.user_id,
        description: time_entries.description,
        hours: time_entries.hours,
        billable: time_entries.billable,
        hourly_rate: time_entries.hourly_rate,
        started_at: time_entries.started_at,
        ended_at: time_entries.ended_at,
        invoiced: time_entries.invoiced,
        invoice_id: time_entries.invoice_id,
        created_at: time_entries.created_at,
        updated_at: time_entries.updated_at,
        user_name: user.name,
      })
      .from(time_entries)
      .leftJoin(user, eq(time_entries.user_id, user.id))
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      timeEntries: timeEntriesResult,
      totalCount: totalCountValue,
      page,
      limit,
      totalPages: Math.ceil(totalCountValue / limit),
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
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
      task_id,
      description,
      hours,
      billable = true,
      hourly_rate,
      started_at,
      ended_at,
    } = body;

    // Validate required fields
    if (!hours || !started_at) {
      return NextResponse.json({
        error: 'Missing required fields: hours, started_at'
      }, { status: 400 });
    }

    const timeEntryId = crypto.randomUUID();

    const timeEntryData = {
      id: timeEntryId,
      project_id: projectId,
      task_id,
      user_id: userId,
      description,
      hours,
      billable,
      hourly_rate,
      started_at: new Date(started_at),
      ended_at: ended_at ? new Date(ended_at) : null,
    };

    await db.insert(time_entries).values(timeEntryData);

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'logged_time',
      'time_entry',
      timeEntryId,
      { hours, description },
      null,
      timeEntryData
    );

    return NextResponse.json({
      timeEntry: timeEntryData,
      message: 'Time entry created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating time entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}