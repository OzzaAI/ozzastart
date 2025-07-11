import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getChatSessionAnalytics, captureError, logSecurityEvent } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin access
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const isAdmin = await checkAdminRole(session.user.id)
    if (!isAdmin) {
      await logSecurityEvent(
        'unauthorized_admin_analytics_access',
        {
          userId: session.user.id,
          path: '/api/admin/analytics'
        },
        session.user.id,
        'high'
      )
      
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse date range
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Default to 7 days ago
      
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date() // Default to now
      
    const userId = searchParams.get('userId') || undefined

    // Get analytics data
    const analytics = await getChatSessionAnalytics(startDate, endDate, userId)

    // Log admin access
    await logSecurityEvent(
      'admin_analytics_accessed',
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId: userId || 'all_users'
      },
      session.user.id,
      'low'
    )

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Admin analytics API error:', error)
    captureError(error as Error, { operation: 'admin_analytics_api' })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check admin role
async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const { db } = await import('@/db/drizzle')
    const { users } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    
    const user = await db.select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    
    return user[0]?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin role:', error)
    return false
  }
}
