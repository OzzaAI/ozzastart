'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmartGuidance, ContextualSidebar, ProgressNudge, SmartEmptyState } from '@/components/ui/smart-guidance'
import { useContextualGuidance, useAdaptiveInterface } from '@/hooks/useContextualGuidance'
import { 
  Plus, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  BarChart3,
  Settings,
  Zap,
  Target,
  Clock
} from 'lucide-react'

interface AdaptiveDashboardProps {
  userRole: 'coach' | 'agency' | 'client' | 'team_member'
  userBehavior: {
    currentPage: string
    timeOnPage: number
    previousActions: string[]
    hesitationPoints: string[]
    completedTasks: string[]
    experienceLevel: 'beginner' | 'intermediate' | 'expert'
    userRole: string
  }
  data: any
}

const AdaptiveDashboard: React.FC<AdaptiveDashboardProps> = ({
  userRole,
  userBehavior,
  data
}) => {
  const { activeGuidance, dismissGuidance } = useContextualGuidance(userBehavior)
  const interfaceState = useAdaptiveInterface(userBehavior)
  const [showContextualHelp, setShowContextualHelp] = useState(false)

  // Auto-show contextual help for beginners
  useEffect(() => {
    if (userBehavior.experienceLevel === 'beginner' && userBehavior.timeOnPage > 5000) {
      setShowContextualHelp(true)
    }
  }, [userBehavior])

  const getQuickActions = () => {
    const actions = []
    
    if (interfaceState.quickActions.includes('create_project')) {
      actions.push({
        id: 'create_project',
        label: 'New Project',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => {
          // Handle project creation
        },
        priority: 1
      })
    }

    if (interfaceState.quickActions.includes('contact_team')) {
      actions.push({
        id: 'contact_team',
        label: 'Contact Team',
        icon: <MessageSquare className="h-4 w-4" />,
        onClick: () => {
          // Handle team contact
        },
        priority: 2
      })
    }

    if (interfaceState.quickActions.includes('view_analytics')) {
      actions.push({
        id: 'view_analytics',
        label: 'Analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        onClick: () => {
          // Handle analytics view
        },
        priority: 3
      })
    }

    return actions.sort((a, b) => a.priority - b.priority)
  }

  const renderRoleSpecificContent = () => {
    switch (userRole) {
      case 'agency':
        return <AgencyDashboardContent data={data} userBehavior={userBehavior} />
      case 'client':
        return <ClientDashboardContent data={data} userBehavior={userBehavior} />
      case 'coach':
        return <CoachDashboardContent data={data} userBehavior={userBehavior} />
      case 'team_member':
        return <TeamMemberDashboardContent data={data} userBehavior={userBehavior} />
      default:
        return <div>Unknown role</div>
    }
  }

  const quickActions = getQuickActions()

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Quick Actions Bar */}
      {quickActions.length > 0 && (
        <div className="fixed top-20 right-4 z-40 space-y-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              onClick={action.onClick}
              className="shadow-lg hover:shadow-xl transition-all duration-200 bg-white text-gray-700 border hover:bg-gray-50"
              size="sm"
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        <div className={`flex-1 p-6 ${showContextualHelp ? 'pr-96' : ''} transition-all duration-300`}>
          {renderRoleSpecificContent()}
        </div>

        {/* Contextual Sidebar */}
        {showContextualHelp && (
          <div className="fixed right-4 top-1/2 transform -translate-y-1/2 transition-all duration-300">
            <ContextualSidebar
              currentPage={userBehavior.currentPage}
              userProgress={userBehavior.completedTasks.length * 10}
              userRole={userRole}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContextualHelp(false)}
              className="mt-2 w-full"
            >
              Hide Help
            </Button>
          </div>
        )}
      </div>

      {/* Smart Guidance Overlay */}
      {activeGuidance && (
        <SmartGuidance
          {...activeGuidance}
          onDismiss={() => dismissGuidance(activeGuidance.title)}
          position="floating"
          autoHide={activeGuidance.type === 'tip'}
        />
      )}

      {/* Show help button for experienced users */}
      {!showContextualHelp && userBehavior.experienceLevel !== 'beginner' && (
        <Button
          onClick={() => setShowContextualHelp(true)}
          className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-600 shadow-lg z-40"
          size="sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Help
        </Button>
      )}
    </div>
  )
}

// Agency-specific dashboard content
const AgencyDashboardContent: React.FC<{ data: any; userBehavior: any }> = ({ data, userBehavior }) => {
  const hasProjects = data?.projects?.length > 0
  const hasTeam = data?.teamMembers?.length > 0

  if (!hasProjects) {
    return (
      <SmartEmptyState
        userRole="agency"
        context="projects"
        onPrimaryAction={() => {
          // Navigate to project creation
          window.location.href = '/dashboard/agency/projects/new'
        }}
        onSecondaryAction={() => {
          // Show templates
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-800">${data?.revenue || '0'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            {data?.revenueGrowth > 0 && (
              <p className="text-xs text-green-600 mt-2">
                ↑ {data.revenueGrowth}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{data?.projects?.length || 0}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{data?.teamMembers?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client Satisfaction</p>
                <p className="text-2xl font-bold">{data?.satisfaction || '0'}/5</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Nudge */}
      {userBehavior.experienceLevel === 'beginner' && (
        <ProgressNudge
          currentStep={userBehavior.completedTasks.length}
          totalSteps={10}
          nextAction="Complete Profile Setup"
          onActionClick={() => {
            // Navigate to profile
          }}
        />
      )}

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Today's Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.priorities?.map((priority: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    priority.urgency === 'high' ? 'bg-red-500' : 
                    priority.urgency === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">{priority.title}</p>
                    <p className="text-sm text-muted-foreground">{priority.description}</p>
                  </div>
                </div>
                <Button size="sm">Action</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Client-specific dashboard content
const ClientDashboardContent: React.FC<{ data: any; userBehavior: any }> = ({ data, userBehavior }) => {
  return (
    <div className="space-y-6">
      {/* Project Progress Hero */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Your AI Project Progress</h2>
              <p className="text-muted-foreground">{data?.projectName || 'AI Implementation'}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{data?.progress || 0}%</div>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${data?.progress || 0}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Next: {data?.nextMilestone || 'Testing phase begins next week'}
          </p>
        </CardContent>
      </Card>

      {/* Communication Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Your Dedicated Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.teamMembers?.map((member: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">
                    {member.name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Coach-specific dashboard content  
const CoachDashboardContent: React.FC<{ data: any; userBehavior: any }> = ({ data, userBehavior }) => {
  return (
    <div className="space-y-6">
      {/* Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data?.agenciesCount || 0}</div>
              <p className="text-sm text-muted-foreground">Agencies Mentored</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${data?.combinedRevenue || '0'}</div>
              <p className="text-sm text-muted-foreground">Combined Revenue</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data?.successRate || 0}%</div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${data?.monthlyEarnings || '0'}</div>
              <p className="text-sm text-muted-foreground">Monthly Earnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agencies Needing Attention */}
      {data?.urgentAgencies?.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Agencies Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.urgentAgencies.map((agency: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                  <div>
                    <p className="font-medium">{agency.name}</p>
                    <p className="text-sm text-muted-foreground">{agency.issue}</p>
                  </div>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    Take Action
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Team member-specific dashboard content
const TeamMemberDashboardContent: React.FC<{ data: any; userBehavior: any }> = ({ data, userBehavior }) => {
  return (
    <div className="space-y-6">
      {/* Today's Focus */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.todaysTasks?.map((task: any, index: number) => (
              <div key={index} className={`p-4 bg-white border-l-4 rounded-lg ${
                task.priority === 'urgent' ? 'border-red-500' : 
                task.priority === 'high' ? 'border-orange-500' : 'border-blue-500'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={task.priority === 'urgent' ? 'destructive' : 'outline'}>
                    {task.priority.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{task.deadline}</span>
                </div>
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-muted-foreground">{task.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm">Start Working</Button>
                  <Button size="sm" variant="outline">Need Help</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdaptiveDashboard