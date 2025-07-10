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
    const deliverable_id = url.searchParams.get('deliverable_id');
    const comment_type = url.searchParams.get('comment_type');
    const visibility = url.searchParams.get('visibility');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;

    // Build base query conditions
    let whereConditions = [eq(project_comments.project_id, projectId)];

    // Add additional filters
    if (task_id) {
      whereConditions.push(eq(project_comments.task_id, task_id));
    }
    if (deliverable_id) {
      whereConditions.push(eq(project_comments.deliverable_id, deliverable_id));
    }
    if (comment_type) {
      whereConditions.push(eq(project_comments.comment_type, comment_type));
    }
    if (visibility) {
      whereConditions.push(eq(project_comments.visibility, visibility));
    }
    if (search) {
      whereConditions.push(
        like(project_comments.content, `%${search}%`)
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(project_comments)
      .where(whereClause);

    const totalCountValue = totalCountResult[0]?.count || 0;

    // Get comments with pagination
    const sortColumn = sortBy === 'created_at' ? project_comments.created_at : 
                      project_comments.created_at; // Default to created_at

    const commentsResult = await db
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
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      comments: commentsResult,
      totalCount: totalCountValue,
      page,
      limit,
      totalPages: Math.ceil(totalCountValue / limit),
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
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
      content,
      task_id,
      deliverable_id,
      parent_comment_id,
      comment_type = 'general',
      visibility = 'project',
      mentions,
    } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json({
        error: 'Missing required field: content'
      }, { status: 400 });
    }

    // Validate comment_type and visibility values
    const validCommentTypes = ['general', 'approval', 'feedback', 'internal'];
    const validVisibilities = ['project', 'client', 'internal'];

    if (!validCommentTypes.includes(comment_type)) {
      return NextResponse.json({ error: 'Invalid comment type value' }, { status: 400 });
    }
    if (!validVisibilities.includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }

    const commentId = crypto.randomUUID();

    const commentData = {
      id: commentId,
      project_id: projectId,
      task_id,
      deliverable_id,
      parent_comment_id,
      content,
      comment_type,
      visibility,
      mentions,
      author_id: userId,
    };

    await db.insert(project_comments).values(commentData);

    // Log activity
    await logProjectActivity(
      projectId,
      userId,
      'commented',
      'comment',
      commentId,
      { comment_content: content },
      null,
      commentData
    );

    return NextResponse.json({
      comment: commentData,
      message: 'Comment created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}