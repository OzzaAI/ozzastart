import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { projects, ozza_account_members, user, project_activity_log } from '@/db/schema';
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

    const project = await db
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

    if (!project.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to the project's agency
    const hasAccess = await checkAgencyAccess(userId, project[0].agency_account_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    return NextResponse.json({ project: project[0] });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
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

    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existingProject.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to the project's agency
    const hasAccess = await checkAgencyAccess(userId, existingProject[0].agency_account_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    const { 
      name,
      description,
      status,
      priority,
      budget,
      currency,
      start_date,
      due_date,
      client_account_id,
      client_user_id,
      project_manager_id,
      template_id,
      metadata,
    } = body;

    const updatedData: Record<string, any> = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;
    if (status) updatedData.status = status;
    if (priority) updatedData.priority = priority;
    if (budget) updatedData.budget = budget;
    if (currency) updatedData.currency = currency;
    if (start_date) updatedData.start_date = new Date(start_date);
    if (due_date) updatedData.due_date = new Date(due_date);
    if (client_account_id) updatedData.client_account_id = client_account_id;
    if (client_user_id) updatedData.client_user_id = client_user_id;
    if (project_manager_id) updatedData.project_manager_id = project_manager_id;
    if (template_id) updatedData.template_id = template_id;
    if (metadata) updatedData.metadata = metadata;

    // Validate status and priority values if provided
    const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    const oldValues = existingProject[0];
    const newValues = { ...oldValues, ...updatedData };

    await db.update(projects).set(updatedData).where(eq(projects.id, projectId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'updated',
      'project',
      projectId,
      { updated_fields: Object.keys(updatedData) },
      oldValues,
      newValues
    );

    return NextResponse.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existingProject.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to the project's agency
    const hasAccess = await checkAgencyAccess(userId, existingProject[0].agency_account_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    await db.delete(projects).where(eq(projects.id, projectId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'deleted',
      'project',
      projectId,
      { deleted_project_name: existingProject[0].name },
      existingProject[0],
      null
    );

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}