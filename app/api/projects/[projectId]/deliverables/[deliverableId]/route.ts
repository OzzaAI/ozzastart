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
  { params }: { params: { projectId: string, deliverableId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, deliverableId } = params;

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

    const deliverable = await db
      .select({
        id: deliverables.id,
        project_id: deliverables.project_id,
        milestone_id: deliverables.milestone_id,
        task_id: deliverables.task_id,
        name: deliverables.name,
        description: deliverables.description,
        type: deliverables.type,
        status: deliverables.status,
        file_url: deliverables.file_url,
        file_name: deliverables.file_name,
        file_size: deliverables.file_size,
        file_type: deliverables.file_type,
        requires_client_approval: deliverables.requires_client_approval,
        submitted_at: deliverables.submitted_at,
        submitted_by: deliverables.submitted_by,
        reviewed_at: deliverables.reviewed_at,
        reviewed_by: deliverables.reviewed_by,
        approval_notes: deliverables.approval_notes,
        due_date: deliverables.due_date,
        version: deliverables.version,
        created_at: deliverables.created_at,
        updated_at: deliverables.updated_at,
        submitted_by_name: user.name,
      })
      .from(deliverables)
      .leftJoin(user, eq(deliverables.submitted_by, user.id))
      .where(and(eq(deliverables.id, deliverableId), eq(deliverables.project_id, projectId)))
      .limit(1);

    if (!deliverable.length) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    return NextResponse.json({ deliverable: deliverable[0] });
  } catch (error) {
    console.error('Error fetching deliverable:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string, deliverableId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, deliverableId } = params;
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

    const existingDeliverable = await db
      .select()
      .from(deliverables)
      .where(and(eq(deliverables.id, deliverableId), eq(deliverables.project_id, projectId)))
      .limit(1);

    if (!existingDeliverable.length) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    const { 
      name,
      description,
      milestone_id,
      task_id,
      type,
      status,
      file_url,
      file_name,
      file_size,
      file_type,
      requires_client_approval,
      submitted_at,
      submitted_by,
      reviewed_at,
      reviewed_by,
      approval_notes,
      due_date,
      version,
    } = body;

    const updatedData: Record<string, any> = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;
    if (milestone_id) updatedData.milestone_id = milestone_id;
    if (task_id) updatedData.task_id = task_id;
    if (type) updatedData.type = type;
    if (status) updatedData.status = status;
    if (file_url) updatedData.file_url = file_url;
    if (file_name) updatedData.file_name = file_name;
    if (file_size) updatedData.file_size = file_size;
    if (file_type) updatedData.file_type = file_type;
    if (requires_client_approval) updatedData.requires_client_approval = requires_client_approval;
    if (submitted_at) updatedData.submitted_at = new Date(submitted_at);
    if (submitted_by) updatedData.submitted_by = submitted_by;
    if (reviewed_at) updatedData.reviewed_at = new Date(reviewed_at);
    if (reviewed_by) updatedData.reviewed_by = reviewed_by;
    if (approval_notes) updatedData.approval_notes = approval_notes;
    if (due_date) updatedData.due_date = new Date(due_date);
    if (version) updatedData.version = version;

    // Validate status value if provided
    const validStatuses = ['pending', 'submitted', 'approved', 'rejected', 'revision-needed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const oldValues = existingDeliverable[0];
    const newValues = { ...oldValues, ...updatedData };

    await db.update(deliverables).set(updatedData).where(eq(deliverables.id, deliverableId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'updated',
      'deliverable',
      deliverableId,
      { deliverable_name: name, updated_fields: Object.keys(updatedData) },
      oldValues,
      newValues
    );

    return NextResponse.json({ message: 'Deliverable updated successfully' });
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string, deliverableId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, deliverableId } = params;

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

    const existingDeliverable = await db
      .select()
      .from(deliverables)
      .where(and(eq(deliverables.id, deliverableId), eq(deliverables.project_id, projectId)))
      .limit(1);

    if (!existingDeliverable.length) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    await db.delete(deliverables).where(eq(deliverables.id, deliverableId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'deleted',
      'deliverable',
      deliverableId,
      { deliverable_name: existingDeliverable[0].name },
      existingDeliverable[0],
      null
    );

    return NextResponse.json({ message: 'Deliverable deleted successfully' });
  } catch (error) {
    console.error('Error deleting deliverable:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}