'use client'

import React, { useState, useEffect } from 'react'
import { 
  Target, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Edit,
  Trash2,
  MoreVertical,
  Flag,
  TrendingUp,
  Users,
  FileText,
  Timer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { type Milestone, type Task, type MilestoneStatus, type CreateMilestoneData } from '@/lib/types/projects'

interface MilestoneTrackerProps {
  projectId: string
  userId: string
  userRole: string
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ projectId, userId, userRole }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    due_date: '',
    requires_client_approval: false
  })

  // Status colors
  const statusColors = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200'
  }

  // Status icons
  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    'in-progress': <Timer className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    overdue: <AlertTriangle className="h-4 w-4" />
  }

  // Fetch milestones
  const fetchMilestones = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/milestones`)
      if (!response.ok) {
        throw new Error('Failed to fetch milestones')
      }

      const data = await response.json()
      setMilestones(data.milestones)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load milestones')
    } finally {
      setLoading(false)
    }
  }

  // Create milestone
  const createMilestone = async () => {
    try {
      const milestoneData: CreateMilestoneData = {
        project_id: projectId,
        name: newMilestone.name,
        description: newMilestone.description,
        due_date: newMilestone.due_date ? new Date(newMilestone.due_date) : undefined,
        requires_client_approval: newMilestone.requires_client_approval
      }

      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(milestoneData)
      })

      if (!response.ok) {
        throw new Error('Failed to create milestone')
      }

      const data = await response.json()
      setMilestones([...milestones, data.milestone])
      setIsCreateDialogOpen(false)
      setNewMilestone({
        name: '',
        description: '',
        due_date: '',
        requires_client_approval: false
      })
    } catch (err) {
      console.error('Failed to create milestone:', err)
    }
  }

  // Update milestone
  const updateMilestone = async (milestoneId: string, updates: Partial<Milestone>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update milestone')
      }

      const data = await response.json()
      setMilestones(milestones.map(m => m.id === milestoneId ? data.milestone : m))
    } catch (err) {
      console.error('Failed to update milestone:', err)
    }
  }

  // Delete milestone
  const deleteMilestone = async (milestoneId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete milestone')
      }

      setMilestones(milestones.filter(m => m.id !== milestoneId))
    } catch (err) {
      console.error('Failed to delete milestone:', err)
    }
  }

  // Mark milestone as complete
  const completeMilestone = async (milestoneId: string) => {
    await updateMilestone(milestoneId, { 
      status: 'completed',
      completed_at: new Date(),
      completion_percentage: 100
    })
  }

  useEffect(() => {
    fetchMilestones()
  }, [projectId])

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Check if milestone is overdue
  const isOverdue = (milestone: Milestone) => {
    if (!milestone.due_date || milestone.status === 'completed') return false
    return new Date(milestone.due_date) < new Date()
  }

  // Get milestone status
  const getMilestoneStatus = (milestone: Milestone): MilestoneStatus => {
    if (milestone.status === 'completed') return 'completed'
    if (isOverdue(milestone)) return 'overdue'
    if (milestone.completion_percentage > 0) return 'in-progress'
    return 'pending'
  }

  // Calculate overall project progress
  const calculateOverallProgress = () => {
    if (milestones.length === 0) return 0
    const totalProgress = milestones.reduce((sum, milestone) => sum + milestone.completion_percentage, 0)
    return Math.round(totalProgress / milestones.length)
  }

  // Get upcoming milestones (next 30 days)
  const getUpcomingMilestones = () => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    return milestones.filter(milestone => 
      milestone.due_date && 
      milestone.status !== 'completed' &&
      new Date(milestone.due_date) <= thirtyDaysFromNow
    )
  }

  // Milestone card component
  const MilestoneCard = ({ milestone }: { milestone: Milestone }) => {
    const status = getMilestoneStatus(milestone)
    const overdue = isOverdue(milestone)

    return (
      <Card className={`hover:shadow-md transition-shadow ${overdue ? 'border-red-200' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">{milestone.name}</CardTitle>
                <Badge className={statusColors[status]} variant="outline">
                  {statusIcons[status]}
                  <span className="ml-1 capitalize">{status.replace('-', ' ')}</span>
                </Badge>
              </div>
              {milestone.description && (
                <p className="text-sm text-gray-600">{milestone.description}</p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingMilestone(milestone)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {milestone.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => completeMilestone(milestone.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-red-600" onClick={() => deleteMilestone(milestone.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{milestone.completion_percentage}%</span>
            </div>
            <Progress value={milestone.completion_percentage} className="h-2" />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Due Date</p>
              <p className={`font-medium ${overdue ? 'text-red-600' : ''}`}>
                {formatDate(milestone.due_date)}
              </p>
            </div>

            <div>
              <p className="text-gray-600">Tasks</p>
              <p className="font-medium">
                {milestone.task_counts?.completed || 0} / {milestone.task_counts?.total || 0}
              </p>
            </div>
          </div>

          {/* Approval status */}
          {milestone.requires_client_approval && (
            <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded border border-yellow-200">
              <Flag className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {milestone.client_approved_at ? 'Client approved' : 'Requires client approval'}
              </span>
            </div>
          )}

          {/* Overdue warning */}
          {overdue && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-800">This milestone is overdue</span>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // Create/Edit milestone dialog
  const MilestoneDialog = () => (
    <Dialog 
      open={isCreateDialogOpen || !!editingMilestone} 
      onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setEditingMilestone(null)
          setNewMilestone({
            name: '',
            description: '',
            due_date: '',
            requires_client_approval: false
          })
        }
      }}
    >
      <DialogTrigger asChild>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Milestone Name</Label>
            <Input
              id="name"
              value={editingMilestone ? editingMilestone.name : newMilestone.name}
              onChange={(e) => {
                if (editingMilestone) {
                  setEditingMilestone({ ...editingMilestone, name: e.target.value })
                } else {
                  setNewMilestone({ ...newMilestone, name: e.target.value })
                }
              }}
              placeholder="Enter milestone name..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editingMilestone ? editingMilestone.description || '' : newMilestone.description}
              onChange={(e) => {
                if (editingMilestone) {
                  setEditingMilestone({ ...editingMilestone, description: e.target.value })
                } else {
                  setNewMilestone({ ...newMilestone, description: e.target.value })
                }
              }}
              placeholder="Describe what needs to be accomplished..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={
                editingMilestone 
                  ? editingMilestone.due_date 
                    ? new Date(editingMilestone.due_date).toISOString().split('T')[0] 
                    : ''
                  : newMilestone.due_date
              }
              onChange={(e) => {
                if (editingMilestone) {
                  setEditingMilestone({ 
                    ...editingMilestone, 
                    due_date: e.target.value ? new Date(e.target.value) : undefined 
                  })
                } else {
                  setNewMilestone({ ...newMilestone, due_date: e.target.value })
                }
              }}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="requires_approval"
              checked={
                editingMilestone 
                  ? editingMilestone.requires_client_approval 
                  : newMilestone.requires_client_approval
              }
              onCheckedChange={(checked) => {
                if (editingMilestone) {
                  setEditingMilestone({ ...editingMilestone, requires_client_approval: checked })
                } else {
                  setNewMilestone({ ...newMilestone, requires_client_approval: checked })
                }
              }}
            />
            <Label htmlFor="requires_approval">Requires client approval</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setEditingMilestone(null)
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingMilestone) {
                  updateMilestone(editingMilestone.id, {
                    name: editingMilestone.name,
                    description: editingMilestone.description,
                    due_date: editingMilestone.due_date,
                    requires_client_approval: editingMilestone.requires_client_approval
                  })
                  setEditingMilestone(null)
                } else {
                  createMilestone()
                }
              }}
              disabled={
                editingMilestone 
                  ? !editingMilestone.name.trim()
                  : !newMilestone.name.trim()
              }
            >
              {editingMilestone ? 'Update' : 'Create'} Milestone
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
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

  const upcomingMilestones = getUpcomingMilestones()
  const overallProgress = calculateOverallProgress()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Target className="h-6 w-6 mr-2" />
            Project Milestones
          </h2>
          <p className="text-gray-600">Track key project deliverables and deadlines</p>
        </div>

        <div className="flex items-center space-x-2">
          <MilestoneDialog />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Milestones</p>
                <p className="text-2xl font-bold">{milestones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {milestones.filter(m => m.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingMilestones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Completion</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Milestones Alert */}
      {upcomingMilestones.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Calendar className="h-4 w-4 text-orange-600" />
          <div>
            <span className="text-orange-800 font-medium">
              {upcomingMilestones.length} milestone{upcomingMilestones.length > 1 ? 's' : ''} due in the next 30 days
            </span>
            <div className="mt-2 space-y-1">
              {upcomingMilestones.slice(0, 3).map(milestone => (
                <div key={milestone.id} className="text-sm text-orange-700">
                  • {milestone.name} - {formatDate(milestone.due_date)}
                </div>
              ))}
              {upcomingMilestones.length > 3 && (
                <div className="text-sm text-orange-700">
                  • and {upcomingMilestones.length - 3} more...
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* Milestones */}
      {milestones.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No milestones defined</h3>
            <p className="text-gray-600 mb-4">
              Create milestones to track key project deliverables and deadlines.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Milestone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {milestones
            .sort((a, b) => a.order_index - b.order_index)
            .map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
        </div>
      )}

      {/* Timeline View */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Milestone Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {milestones
                .filter(m => m.due_date)
                .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                .map((milestone, index, array) => {
                  const status = getMilestoneStatus(milestone)
                  const isLast = index === array.length - 1

                  return (
                    <div key={milestone.id} className="relative">
                      {!isLast && (
                        <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200" />
                      )}
                      <div className="flex items-start space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          status === 'completed' ? 'bg-green-500 border-green-500' :
                          status === 'in-progress' ? 'bg-blue-500 border-blue-500' :
                          status === 'overdue' ? 'bg-red-500 border-red-500' :
                          'bg-white border-gray-300'
                        }`}>
                          {status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${
                              status === 'in-progress' ? 'bg-white' :
                              status === 'overdue' ? 'bg-white' :
                              'bg-gray-300'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{milestone.name}</h4>
                            <Badge className={statusColors[status]} variant="outline">
                              {status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Due: {formatDate(milestone.due_date)} • {milestone.completion_percentage}% complete
                          </p>
                          {milestone.requires_client_approval && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Flag className="h-3 w-3 text-yellow-600" />
                              <span className="text-xs text-yellow-800">Client approval required</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MilestoneTracker