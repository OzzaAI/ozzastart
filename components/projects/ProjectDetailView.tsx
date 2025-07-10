'use client'

import React, { useState, useEffect } from 'react'
// import { motion } from "framer-motion"
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings, 
  Edit, 
  MoreVertical,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { type Project, type Task, type Milestone, type ProjectActivity } from '@/lib/types/projects'
import TaskManagement from './TaskManagement'
import MilestoneManagement from './MilestoneManagement'
import FileManagement from './FileManagement'
import TimeTracking from './TimeTracking'
import CommentManagement from './CommentManagement'

interface ProjectDetailViewProps {
  projectId: string
  userId: string
  userRole: string
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ projectId, userId, userRole }) => {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [recentActivity, setRecentActivity] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Priority colors
  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
  }

  // Status colors
  const statusColors = {
    planning: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  }

  // Task status colors
  const taskStatusColors = {
    todo: 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    blocked: 'bg-red-100 text-red-800 border-red-200'
  }

  // Milestone status colors
  const milestoneStatusColors = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200'
  }

  // Fetch project data
  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      const data = await response.json()
      setProject(data.project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }

  // Fetch milestones
  const fetchMilestones = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`)
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones)
      }
    } catch (err) {
      console.error('Failed to fetch milestones:', err)
    }
  }

  // Fetch activity
  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/activity?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.activities)
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err)
    }
  }

  useEffect(() => {
    fetchProject()
    fetchTasks()
    fetchMilestones()
    fetchActivity()
  }, [projectId])

  // Format currency
  const formatCurrency = (amount?: number, currency = 'USD') => {
    if (!amount) return 'Not set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount / 100)
  }

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate project progress
  const calculateProgress = () => {
    if (!project?.task_counts) return 0
    const { completed, total } = project.task_counts
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  // Check if project is overdue
  const isOverdue = () => {
    if (!project?.due_date || project.status === 'completed') return false
    return new Date(project.due_date) < new Date()
  }

  // Project header
  const ProjectHeader = () => (
    <div
      className="bg-white border-b"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">{project?.name}</h1>
              <Badge className={statusColors[project?.status || 'planning']}>
                {project?.status}
              </Badge>
              <Badge className={priorityColors[project?.priority || 'medium']}>
                {project?.priority}
              </Badge>
            </div>
            {project?.description && (
              <p className="text-gray-600 max-w-2xl">{project.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Archive Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick stats */}
        <div
          className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Progress</p>
            <p className="text-xl font-semibold">{calculateProgress()}%</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Tasks</p>
            <p className="text-xl font-semibold">
              {project?.task_counts?.completed || 0}/{project?.task_counts?.total || 0}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Budget</p>
            <p className="text-xl font-semibold">{formatCurrency(project?.budget, project?.currency)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Due Date</p>
            <p className={`text-xl font-semibold ${isOverdue() ? 'text-red-600' : ''}`}>
              {formatDate(project?.due_date)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Team Size</p>
            <p className="text-xl font-semibold">{project?.team_members?.length || 0}</p>
          </div>
        </div>

        {isOverdue() && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-red-800">This project is overdue</span>
          </Alert>
        )}
      </div>
    </div>
  )

  // Overview tab content
  const OverviewTab = () => (
    <div
      className="grid gap-6 lg:grid-cols-3"
    >
      {/* Project Progress */}
      <div className="lg:col-span-2 space-y-6">
        {/* Progress Card */}
        <div
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{calculateProgress()}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-3" />
                
                {project?.task_counts && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="font-medium">{project.task_counts.todo}</p>
                      <p className="text-gray-600">To Do</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="font-medium">{project.task_counts.in_progress}</p>
                      <p className="text-gray-600">In Progress</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="font-medium">{project.task_counts.review}</p>
                      <p className="text-gray-600">Review</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="font-medium">{project.task_counts.completed}</p>
                      <p className="text-gray-600">Completed</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="font-medium">{project.task_counts.blocked}</p>
                      <p className="text-gray-600">Blocked</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <div
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Recent Tasks
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in-progress' ? 'bg-blue-500' :
                        task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          Assigned to {task.assigned_user_name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={taskStatusColors[task.status]}>{task.status}</Badge>
                      <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No tasks found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Milestones */}
        <div
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Milestones
                </CardTitle>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{milestone.name}</h4>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                        )}
                      </div>
                      <Badge className={milestoneStatusColors[milestone.status]}>
                        {milestone.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{milestone.completion_percentage}%</span>
                      </div>
                      <Progress value={milestone.completion_percentage} className="h-2" />
                    </div>

                    <div className="flex justify-between text-sm text-gray-600 mt-3">
                      <span>Due: {formatDate(milestone.due_date)}</span>
                      <span>{milestone.tasks?.length || 0} tasks</span>
                    </div>
                  </div>
                ))}
                {milestones.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No milestones defined</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Project Details */}
        <div
        >
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Project Manager</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {project?.project_manager_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project?.project_manager_name || 'Unassigned'}</p>
                    <p className="text-sm text-gray-600">{project?.project_manager_email}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-medium">{formatDate(project?.start_date)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className={`font-medium ${isOverdue() ? 'text-red-600' : ''}`}>
                  {formatDate(project?.due_date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-medium">{formatCurrency(project?.budget, project?.currency)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{formatDate(project?.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team
                </CardTitle>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project?.team_members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user_image} />
                        <AvatarFallback>{member.user_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user_name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!project?.team_members || project.team_members.length === 0) && (
                  <p className="text-center text-gray-500 py-4">No team members assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user_name}</span> {activity.action} {activity.entity_type}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border-b">
          <div className="p-6">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-red-800">{error}</span>
      </Alert>
    )
  }

  if (!project) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <span className="text-yellow-800">Project not found</span>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHeader />
      
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManagement projectId={projectId} userId={userId} userRole={userRole} />
          </TabsContent>

          <TabsContent value="milestones">
            <MilestoneManagement projectId={projectId} userId={userId} userRole={userRole} />
          </TabsContent>

          <TabsContent value="files">
            <FileManagement projectId={projectId} userId={userId} userRole={userRole} />
          </TabsContent>

          <TabsContent value="time">
            <TimeTracking projectId={projectId} userId={userId} userRole={userRole} />
          </TabsContent>

          <TabsContent value="comments">
            <CommentManagement projectId={projectId} userId={userId} userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ProjectDetailView