'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  User,
  Filter,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { 
  type Project, 
  type Task, 
  type Milestone, 
  type Deliverable, 
  type ProjectComment,
  type ProjectActivity 
} from '@/lib/types/projects'

interface ClientPortalProps {
  projectId: string
  userId: string
  userRole: string
}

const ClientPortal: React.FC<ClientPortalProps> = ({ projectId, userId, userRole }) => {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [recentActivity, setRecentActivity] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [newComment, setNewComment] = useState('')
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)

  // Status colors (client-friendly)
  const statusColors = {
    planning: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  }

  // Deliverable status colors
  const deliverableStatusColors = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    'revision-needed': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  // Milestone status colors
  const milestoneStatusColors = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200'
  }

  // Fetch project data (client view only shows client-visible information)
  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}?client_view=true`)
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

  // Fetch deliverables (client-visible only)
  const fetchDeliverables = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/deliverables?client_view=true`)
      if (response.ok) {
        const data = await response.json()
        setDeliverables(data.deliverables)
      }
    } catch (err) {
      console.error('Failed to fetch deliverables:', err)
    }
  }

  // Fetch milestones
  const fetchMilestones = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones?client_view=true`)
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones)
      }
    } catch (err) {
      console.error('Failed to fetch milestones:', err)
    }
  }

  // Fetch comments (client-visible only)
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments?client_view=true&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    }
  }

  // Fetch activity (client-visible only)
  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/activity?client_view=true&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.activities)
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err)
    }
  }

  // Post comment
  const postComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment,
          comment_type: 'general',
          visibility: 'project'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      const data = await response.json()
      setComments([data.comment, ...comments])
      setNewComment('')
      setIsCommentDialogOpen(false)
    } catch (err) {
      console.error('Failed to post comment:', err)
    }
  }

  // Approve deliverable
  const approveDeliverable = async (deliverableId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/deliverables/${deliverableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'approved',
          approval_notes: ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve deliverable')
      }

      const data = await response.json()
      setDeliverables(deliverables.map(d => d.id === deliverableId ? data.deliverable : d))
    } catch (err) {
      console.error('Failed to approve deliverable:', err)
    }
  }

  useEffect(() => {
    fetchProject()
    fetchDeliverables()
    fetchMilestones()
    fetchComments()
    fetchActivity()
  }, [projectId])

  // Format currency
  const formatCurrency = (amount?: number, currency = 'USD') => {
    if (!amount) return 'Not disclosed'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount / 100)
  }

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
              <Badge className={statusColors[project?.status || 'planning']} variant="outline">
                {project?.status?.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
            {project?.description && (
              <p className="text-gray-700 max-w-2xl text-lg">{project.description}</p>
            )}
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Managed by</p>
            <div className="flex items-center space-x-2 mt-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>
                  {project?.project_manager_name?.charAt(0) || 'PM'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{project?.project_manager_name}</p>
                <p className="text-sm text-gray-600">{project?.project_manager_email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{calculateProgress()}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {project?.task_counts?.completed || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Due Date</p>
                <p className={`text-lg font-bold ${isOverdue() ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(project?.due_date)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Deliverables</p>
                <p className="text-2xl font-bold text-gray-900">{deliverables.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-900">Project Progress</h3>
            <span className="text-sm font-medium text-gray-600">{calculateProgress()}% Complete</span>
          </div>
          <Progress value={calculateProgress()} className="h-3" />
        </div>

        {isOverdue() && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-red-800">This project is past its due date</span>
          </Alert>
        )}
      </div>
    </div>
  )

  // Overview tab content
  const OverviewTab = () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Project Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative">
                  {index < milestones.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200" />
                  )}
                  <div className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'in-progress' ? 'bg-blue-500' :
                      milestone.status === 'overdue' ? 'bg-red-500' : 'bg-gray-300'
                    }`}>
                      {milestone.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{milestone.name}</h4>
                        <Badge className={milestoneStatusColors[milestone.status]} variant="outline">
                          {milestone.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      {milestone.description && (
                        <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Due: {formatDate(milestone.due_date)}</span>
                          <span>{milestone.task_counts?.completed || 0} / {milestone.task_counts?.total || 0} tasks</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {milestone.completion_percentage}% complete
                        </div>
                      </div>
                      <Progress value={milestone.completion_percentage} className="h-2 mt-2" />
                    </div>
                  </div>
                </div>
              ))}
              {milestones.length === 0 && (
                <p className="text-center text-gray-500 py-8">No milestones have been set up yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user_image} />
                    <AvatarFallback>
                      {activity.user_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span> {activity.action} {activity.entity_type}
                      {activity.details && (
                        <span className="text-gray-600"> - {activity.details}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-gray-500 py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Start Date</p>
              <p className="text-gray-900">{formatDate(project?.start_date)}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-gray-600">Expected Completion</p>
              <p className={`${isOverdue() ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(project?.due_date)}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-gray-600">Project Budget</p>
              <p className="text-gray-900">{formatCurrency(project?.budget, project?.currency)}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-gray-900">{project?.task_counts?.total || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Leave Feedback
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Leave Project Feedback</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <textarea
                    className="w-full p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Share your thoughts, questions, or feedback about the project..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={postComment} disabled={!newComment.trim()}>
                      Post Feedback
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View All Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Deliverables tab content
  const DeliverablesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Deliverables</h3>
        <Badge variant="secondary">{deliverables.length} total</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deliverables.map((deliverable) => (
          <Card key={deliverable.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{deliverable.name}</CardTitle>
                  {deliverable.description && (
                    <p className="text-sm text-gray-600 mt-1">{deliverable.description}</p>
                  )}
                </div>
                <Badge className={deliverableStatusColors[deliverable.status]} variant="outline">
                  {deliverable.status.replace('-', ' ')}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Type</span>
                <span className="font-medium capitalize">{deliverable.type}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Due Date</span>
                <span className="font-medium">{formatDate(deliverable.due_date)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Version</span>
                <span className="font-medium">v{deliverable.version}</span>
              </div>

              {deliverable.file_url && (
                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {deliverable.requires_client_approval && deliverable.status === 'submitted' && (
                <div className="pt-2 border-t">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => approveDeliverable(deliverable.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Request Changes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {deliverables.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No deliverables yet</h3>
            <p className="text-gray-600">
              Project deliverables will appear here as they become available for review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Comments tab content
  const CommentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Communication</h3>
        <Button onClick={() => setIsCommentDialogOpen(true)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author_image} />
                  <AvatarFallback>
                    {comment.author_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{comment.author_name}</span>
                    <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {comment.comment_type}
                    </Badge>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {comments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
            <p className="text-gray-600 mb-4">
              Start the conversation by leaving your first comment or question.
            </p>
            <Button onClick={() => setIsCommentDialogOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Leave First Comment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="p-6">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
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
        <span className="text-yellow-800">Project not found or access denied</span>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHeader />
      
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="deliverables">
            <DeliverablesTab />
          </TabsContent>

          <TabsContent value="communication">
            <CommentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ClientPortal