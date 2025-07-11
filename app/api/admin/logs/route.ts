import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getSecurityLogs, type LogsFilter, type LogsPagination } from '@/lib/monitoring'
import { captureError, logSecurityEvent } from '@/lib/monitoring'

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

    // Check if user is admin (you'll need to implement this check)
    const isAdmin = await checkAdminRole(session.user.id)
    if (!isAdmin) {
      await logSecurityEvent(
        'unauthorized_admin_logs_access',
        {
          userId: session.user.id,
          path: '/api/admin/logs'
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
    
    // Check if this is an export request
    const isExport = searchParams.get('export') === 'true'
    
    // Parse filters
    const filters: LogsFilter = {
      eventType: searchParams.get('eventType') || undefined,
      severity: searchParams.get('severity') as any || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      search: searchParams.get('search') || undefined,
    }

    // Parse pagination
    const pagination: LogsPagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: isExport ? 10000 : parseInt(searchParams.get('limit') || '50'), // Higher limit for export
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    }

    // Get logs
    const result = await getSecurityLogs(filters, pagination)

    // Log admin access
    await logSecurityEvent(
      'admin_logs_accessed',
      {
        filters: Object.keys(filters).filter(key => filters[key as keyof LogsFilter] !== undefined),
        pagination: { page: pagination.page, limit: pagination.limit },
        isExport
      },
      session.user.id,
      'low'
    )

    if (isExport) {
      // Generate CSV for export
      const csv = generateCSV(result.logs)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="security-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Admin logs API error:', error)
    captureError(error as Error, { operation: 'admin_logs_api' })
    
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

// Generate CSV from logs data
function generateCSV(logs: any[]): string {
  const headers = ['Date', 'Event Type', 'Severity', 'User', 'Details']
  
  const rows = logs.map(log => [
    new Date(log.createdAt).toISOString(),
    log.eventType,
    log.severity,
    log.userName || 'Unknown',
    JSON.stringify(log.details).replace(/"/g, '""') // Escape quotes for CSV
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csvContent
}
