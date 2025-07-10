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
  { params }: { params: { projectId: string, timeEntryId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, timeEntryId } = params;

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

    const timeEntry = await db
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
      .where(and(eq(time_entries.id, timeEntryId), eq(time_entries.project_id, projectId)))
      .limit(1);

    if (!timeEntry.length) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    return NextResponse.json({ timeEntry: timeEntry[0] });
  } catch (error) {
    console.error('Error fetching time entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string, timeEntryId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, timeEntryId } = params;
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

    const existingTimeEntry = await db
      .select()
      .from(time_entries)
      .where(and(eq(time_entries.id, timeEntryId), eq(time_entries.project_id, projectId)))
      .limit(1);

    if (!existingTimeEntry.length) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    const { 
      task_id,
      description,
      hours,
      billable,
      hourly_rate,
      started_at,
      ended_at,
      invoiced,
      invoice_id,
    } = body;

    const updatedData: Record<string, any> = {};
    if (task_id) updatedData.task_id = task_id;
    if (description) updatedData.description = description;
    if (hours) updatedData.hours = hours;
    if (billable) updatedData.billable = billable;
    if (hourly_rate) updatedData.hourly_rate = hourly_rate;
    if (started_at) updatedData.started_at = new Date(started_at);
    if (ended_at) updatedData.ended_at = new Date(ended_at);
    if (invoiced) updatedData.invoiced = invoiced;
    if (invoice_id) updatedData.invoice_id = invoice_id;

    const oldValues = existingTimeEntry[0];
    const newValues = { ...oldValues, ...updatedData };

    await db.update(time_entries).set(updatedData).where(eq(time_entries.id, timeEntryId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'updated',
      'time_entry',
      timeEntryId,
      { hours, description, updated_fields: Object.keys(updatedData) },
      oldValues,
      newValues
    );

    return NextResponse.json({ message: 'Time entry updated successfully' });
  } catch (error) {
    console.error('Error updating time entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string, timeEntryId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, timeEntryId } = params;

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

    const existingTimeEntry = await db
      .select()
      .from(time_entries)
      .where(and(eq(time_entries.id, timeEntryId), eq(time_entries.project_id, projectId)))
      .limit(1);

    if (!existingTimeEntry.length) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    await db.delete(time_entries).where(eq(time_entries.id, timeEntryId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'deleted',
      'time_entry',
      timeEntryId,
      { hours: existingTimeEntry[0].hours, description: existingTimeEntry[0].description },
      existingTimeEntry[0],
      null
    );

    return NextResponse.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}