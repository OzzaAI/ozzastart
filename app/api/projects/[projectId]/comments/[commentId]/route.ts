import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { project_comments, projects, ozza_account_members, user, project_activity_log } from '@/db/schema';
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
  { params }: { params: { projectId: string, commentId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, commentId } = params;

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

    const comment = await db
      .select({
        id: project_comments.id,
        project_id: project_comments.project_id,
        task_id: project_comments.task_id,
        deliverable_id: project_comments.deliverable_id,
        parent_comment_id: project_comments.parent_comment_id,
        content: project_comments.content,
        comment_type: project_comments.comment_type,
        visibility: project_comments.visibility,
        mentions: project_comments.mentions,
        author_id: project_comments.author_id,
        created_at: project_comments.created_at,
        updated_at: project_comments.updated_at,
        deleted_at: project_comments.deleted_at,
        author_name: user.name,
        author_image: user.image,
      })
      .from(project_comments)
      .leftJoin(user, eq(project_comments.author_id, user.id))
      .where(and(eq(project_comments.id, commentId), eq(project_comments.project_id, projectId)))
      .limit(1);

    if (!comment.length) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ comment: comment[0] });
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string, commentId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, commentId } = params;
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

    const existingComment = await db
      .select()
      .from(project_comments)
      .where(and(eq(project_comments.id, commentId), eq(project_comments.project_id, projectId)))
      .limit(1);

    if (!existingComment.length) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const { 
      content,
      comment_type,
      visibility,
      mentions,
      deleted_at,
    } = body;

    const updatedData: Record<string, any> = {};
    if (content) updatedData.content = content;
    if (comment_type) updatedData.comment_type = comment_type;
    if (visibility) updatedData.visibility = visibility;
    if (mentions) updatedData.mentions = mentions;
    if (deleted_at) updatedData.deleted_at = new Date(deleted_at);

    // Validate comment_type and visibility values if provided
    const validCommentTypes = ['general', 'approval', 'feedback', 'internal'];
    const validVisibilities = ['project', 'client', 'internal'];

    if (comment_type && !validCommentTypes.includes(comment_type)) {
      return NextResponse.json({ error: 'Invalid comment type value' }, { status: 400 });
    }
    if (visibility && !validVisibilities.includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }

    const oldValues = existingComment[0];
    const newValues = { ...oldValues, ...updatedData };

    await db.update(project_comments).set(updatedData).where(eq(project_comments.id, commentId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'updated',
      'comment',
      commentId,
      { comment_content: content, updated_fields: Object.keys(updatedData) },
      oldValues,
      newValues
    );

    return NextResponse.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string, commentId: string } }
) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result?.session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = result.session.userId;
    const { projectId, commentId } = params;

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

    const existingComment = await db
      .select()
      .from(project_comments)
      .where(and(eq(project_comments.id, commentId), eq(project_comments.project_id, projectId)))
      .limit(1);

    if (!existingComment.length) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await db.delete(project_comments).where(eq(project_comments.id, commentId));

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'deleted',
      'comment',
      commentId,
      { comment_content: existingComment[0].content },
      existingComment[0],
      null
    );

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}