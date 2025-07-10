import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { project_files, projects, ozza_account_members, user, project_activity_log } from '@/db/schema';
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
  { params }: { params: { projectId: string, fileId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, fileId } = params;

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

    const file = await db
      .select({
        id: project_files.id,
        project_id: project_files.project_id,
        task_id: project_files.task_id,
        deliverable_id: project_files.deliverable_id,
        file_name: project_files.file_name,
        file_url: project_files.file_url,
        file_size: project_files.file_size,
        file_type: project_files.file_type,
        description: project_files.description,
        visibility: project_files.visibility,
        uploaded_by: project_files.uploaded_by,
        created_at: project_files.created_at,
        uploaded_by_name: user.name,
      })
      .from(project_files)
      .leftJoin(user, eq(project_files.uploaded_by, user.id))
      .where(and(eq(project_files.id, fileId), eq(project_files.project_id, projectId)))
      .limit(1);

    if (!file.length) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ file: file[0] });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string, fileId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, fileId } = params;
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

    const existingFile = await db
      .select()
      .from(project_files)
      .where(and(eq(project_files.id, fileId), eq(project_files.project_id, projectId)))
      .limit(1);

    if (!existingFile.length) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const { 
      file_name,
      file_url,
      file_size,
      file_type,
      description,
      task_id,
      deliverable_id,
      visibility,
    } = body;

    const updatedData: Record<string, any> = {};
    if (file_name) updatedData.file_name = file_name;
    if (file_url) updatedData.file_url = file_url;
    if (file_size) updatedData.file_size = file_size;
    if (file_type) updatedData.file_type = file_type;
    if (description) updatedData.description = description;
    if (task_id) updatedData.task_id = task_id;
    if (deliverable_id) updatedData.deliverable_id = deliverable_id;
    if (visibility) updatedData.visibility = visibility;

    // Validate visibility value if provided
    const validVisibilities = ['project', 'client', 'internal'];
    if (visibility && !validVisibilities.includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }

    const oldValues = existingFile[0];
    const newValues = { ...oldValues, ...updatedData };

    await db.update(project_files).set(updatedData).where(eq(project_files.id, fileId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'updated',
      'file',
      fileId,
      { file_name: file_name, updated_fields: Object.keys(updatedData) },
      oldValues,
      newValues
    );

    return NextResponse.json({ message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string, fileId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, fileId } = params;

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

    const existingFile = await db
      .select()
      .from(project_files)
      .where(and(eq(project_files.id, fileId), eq(project_files.project_id, projectId)))
      .limit(1);

    if (!existingFile.length) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await db.delete(project_files).where(eq(project_files.id, fileId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'deleted',
      'file',
      fileId,
      { file_name: existingFile[0].file_name },
      existingFile[0],
      null
    );

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}