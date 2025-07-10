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
  { params }: { params: { projectId: string, milestoneId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, milestoneId } = params;

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

    const milestone = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, milestoneId), eq(milestones.project_id, projectId)))
      .limit(1);

    if (!milestone.length) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    return NextResponse.json({ milestone: milestone[0] });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string, milestoneId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, milestoneId } = params;
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

    const existingMilestone = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, milestoneId), eq(milestones.project_id, projectId)))
      .limit(1);

    if (!existingMilestone.length) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const { 
      name,
      description,
      due_date,
      status,
      order_index,
      completion_percentage,
      requires_client_approval,
      client_approved_at,
      client_approved_by,
      completed_at,
    } = body;

    const updatedData: Record<string, any> = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;
    if (due_date) updatedData.due_date = new Date(due_date);
    if (status) updatedData.status = status;
    if (order_index) updatedData.order_index = order_index;
    if (completion_percentage) updatedData.completion_percentage = completion_percentage;
    if (requires_client_approval) updatedData.requires_client_approval = requires_client_approval;
    if (client_approved_at) updatedData.client_approved_at = new Date(client_approved_at);
    if (client_approved_by) updatedData.client_approved_by = client_approved_by;
    if (completed_at) updatedData.completed_at = new Date(completed_at);

    // Validate status value if provided
    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const oldValues = existingMilestone[0];
    const newValues = { ...oldValues, ...updatedData };

    await db.update(milestones).set(updatedData).where(eq(milestones.id, milestoneId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'updated',
      'milestone',
      milestoneId,
      { milestone_name: name, updated_fields: Object.keys(updatedData) },
      oldValues,
      newValues
    );

    return NextResponse.json({ message: 'Milestone updated successfully' });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string, milestoneId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, milestoneId } = params;

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

    const existingMilestone = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, milestoneId), eq(milestones.project_id, projectId)))
      .limit(1);

    if (!existingMilestone.length) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    await db.delete(milestones).where(eq(milestones.id, milestoneId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'deleted',
      'milestone',
      milestoneId,
      { milestone_name: existingMilestone[0].name },
      existingMilestone[0],
      null
    );

    return NextResponse.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}