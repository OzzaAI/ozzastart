'use client'

import React, { useState, useEffect } from 'react'
// import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { type Milestone, type MilestoneStatus } from '@/lib/types/projects'

interface MilestoneManagementProps {
  projectId: string
  userId: string
  userRole: string
}

const MilestoneManagement: React.FC<MilestoneManagementProps> = ({ projectId, userId, userRole }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<MilestoneStatus | 'all'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    due_date: '',
    requires_client_approval: false
  })

  // Milestone status colors
  const milestoneStatusColors = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200'
  }

  // Fetch milestones
  const fetchMilestones = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        project_id: projectId,
        sort_by: 'due_date',
        sort_order: 'asc'
      })

      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      if (filterStatus !== 'all') {
        queryParams.append('status', filterStatus)
      }

      const response = await fetch(`/api/projects/${projectId}/milestones?${queryParams}`)
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
      const milestoneData = {
        ...newMilestone,
        project_id: projectId,
        due_date: newMilestone.due_date ? new Date(newMilestone.due_date) : undefined
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

  // Update milestone status (example)
  const updateMilestoneStatus = async (milestoneId: string, newStatus: MilestoneStatus) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
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

  useEffect(() => {
    fetchMilestones()
  }, [projectId, searchQuery, filterStatus])

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Check if milestone is overdue
  const isOverdue = (milestone: Milestone) => {
    if (!milestone.due_date || milestone.status === 'completed') return false
    return new Date(milestone.due_date) < new Date()
  }

  // Create milestone dialog
  const CreateMilestoneDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Milestone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Milestone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
              placeholder="Enter milestone name..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              placeholder="Enter milestone description..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={newMilestone.due_date}
              onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requires_client_approval"
              checked={newMilestone.requires_client_approval}
              onChange={(e) => setNewMilestone({ ...newMilestone, requires_client_approval: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="requires_client_approval">Requires Client Approval</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createMilestone} disabled={!newMilestone.name.trim()}>
              Create Milestone
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
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
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

  return (
    <div
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Milestones</h2>
          <p className="text-gray-600">Track key project phases and deliverables</p>
        </div>

        <div className="flex items-center space-x-2">
          <CreateMilestoneDialog />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={filterStatus}
            onValueChange={(value: MilestoneStatus | 'all') => setFilterStatus(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No milestones found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first milestone.'}
            </p>
            {!(searchQuery || filterStatus !== 'all') && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {milestones.map((milestone) => {
            const overdue = isOverdue(milestone)
            return (
              <div
              key={milestone.id}
            >
              <Card className={`h-full flex flex-col ${overdue ? 'border-red-200' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{milestone.name}</CardTitle>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{milestone.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{milestone.completion_percentage}%</span>
                    </div>
                    <Progress value={milestone.completion_percentage} className="h-2" />
                  </div>

                  {/* Milestone details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Status</p>
                      <Badge className={milestoneStatusColors[milestone.status]}>{milestone.status}</Badge>
                    </div>

                    <div>
                      <p className="text-gray-600">Due Date</p>
                      <p className={`font-medium mt-1 ${overdue ? 'text-red-600' : ''}`}>
                        {formatDate(milestone.due_date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Client Approval</p>
                      <p className="font-medium mt-1">
                        {milestone.requires_client_approval ? 'Required' : 'Not Required'}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Tasks</p>
                      <p className="font-medium mt-1">
                        {milestone.task_counts?.completed || 0} / {milestone.task_counts?.total || 0}
                      </p>
                    </div>
                  </div>

                  {overdue && (
                    <Alert className="border-red-200 bg-red-50">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="text-red-800 text-sm">This milestone is overdue</span>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MilestoneManagement