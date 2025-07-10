import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { tasks, projects, ozza_account_members, user, project_activity_log } from '@/db/schema';
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
  { params }: { params: { projectId: string, taskId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, taskId } = params;

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

    const task = await db
      .select({
        id: tasks.id,
        project_id: tasks.project_id,
        milestone_id: tasks.milestone_id,
        parent_task_id: tasks.parent_task_id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assigned_to: tasks.assigned_to,
        estimated_hours: tasks.estimated_hours,
        actual_hours: tasks.actual_hours,
        start_date: tasks.start_date,
        due_date: tasks.due_date,
        completed_at: tasks.completed_at,
        tags: tasks.tags,
        order_index: tasks.order_index,
        created_by: tasks.created_by,
        created_at: tasks.created_at,
        updated_at: tasks.updated_at,
        assigned_user_name: user.name,
        assigned_user_image: user.image,
      })
      .from(tasks)
      .leftJoin(user, eq(tasks.assigned_to, user.id))
      .where(and(eq(tasks.id, taskId), eq(tasks.project_id, projectId)))
      .limit(1);

    if (!task.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: task[0] });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string, taskId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, taskId } = params;
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

    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.project_id, projectId)))
      .limit(1);

    if (!existingTask.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { 
      title,
      description,
      milestone_id,
      parent_task_id,
      status,
      priority,
      assigned_to,
      estimated_hours,
      actual_hours,
      start_date,
      due_date,
      completed_at,
      tags,
      order_index,
    } = body;

    const updatedData: Record<string, any> = {};
    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (milestone_id) updatedData.milestone_id = milestone_id;
    if (parent_task_id) updatedData.parent_task_id = parent_task_id;
    if (status) updatedData.status = status;
    if (priority) updatedData.priority = priority;
    if (assigned_to) updatedData.assigned_to = assigned_to;
    if (estimated_hours) updatedData.estimated_hours = estimated_hours;
    if (actual_hours) updatedData.actual_hours = actual_hours;
    if (start_date) updatedData.start_date = new Date(start_date);
    if (due_date) updatedData.due_date = new Date(due_date);
    if (completed_at) updatedData.completed_at = new Date(completed_at);
    if (tags) updatedData.tags = tags;
    if (order_index) updatedData.order_index = order_index;

    // Validate status and priority values if provided
    const validStatuses = ['todo', 'in-progress', 'review', 'completed', 'blocked'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    const oldValues = existingTask[0];
    const newValues = { ...oldValues, ...updatedData };

    await db.update(tasks).set(updatedData).where(eq(tasks.id, taskId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'updated',
      'task',
      taskId,
      { task_title: title, updated_fields: Object.keys(updatedData) },
      oldValues,
      newValues
    );

    return NextResponse.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string, taskId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, taskId } = params;

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

    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.project_id, projectId)))
      .limit(1);

    if (!existingTask.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'deleted',
      'task',
      taskId,
      { task_title: existingTask[0].title },
      existingTask[0],
      null
    );

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}