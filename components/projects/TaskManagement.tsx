'use client'

import React, { useState, useEffect } from 'react'
// import { motion } from "framer-motion"
import { 
  Plus, 
  Search, 
  Filter, 
  List, 
  Grid, 
  Calendar, 
  User, 
  Clock, 
  MessageSquare, 
  Paperclip,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
  ArrowRight,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { type Task, type TaskFilters, type TaskViewState, type TaskStatus, type Priority } from '@/lib/types/projects'

interface TaskManagementProps {
  projectId: string
  userId: string
  userRole: string
}

const TaskManagement: React.FC<TaskManagementProps> = ({ projectId, userId, userRole }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewState, setViewState] = useState<TaskViewState>({
    view: 'kanban',
    filters: {},
    groupBy: 'status',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    assigned_to: '',
    due_date: ''
  })

  // Task status columns for Kanban
  const statusColumns = [
    { id: 'todo', name: 'To Do', color: 'bg-gray-100 border-gray-300' },
    { id: 'in-progress', name: 'In Progress', color: 'bg-blue-100 border-blue-300' },
    { id: 'review', name: 'Review', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'completed', name: 'Completed', color: 'bg-green-100 border-green-300' },
    { id: 'blocked', name: 'Blocked', color: 'bg-red-100 border-red-300' }
  ]

  // Priority colors
  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
  }

  // Status colors
  const statusColors = {
    todo: 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    blocked: 'bg-red-100 text-red-800 border-red-200'
  }

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        project_id: projectId,
        sort_by: viewState.sortBy,
        sort_order: viewState.sortOrder,
        limit: '100'
      })

      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      if (viewState.filters.status && viewState.filters.status.length > 0) {
        queryParams.append('status', viewState.filters.status.join(','))
      }

      if (viewState.filters.priority && viewState.filters.priority.length > 0) {
        queryParams.append('priority', viewState.filters.priority.join(','))
      }

      if (viewState.filters.assigned_to) {
        queryParams.append('assigned_to', viewState.filters.assigned_to)
      }

      const response = await fetch(`/api/projects/${projectId}/tasks?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      setTasks(data.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  // Create task
  const createTask = async () => {
    try {
      const taskData = {
        ...newTask,
        project_id: projectId,
        due_date: newTask.due_date ? new Date(newTask.due_date) : undefined
      }

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      const data = await response.json()
      setTasks([data.task, ...tasks])
      setIsCreateDialogOpen(false)
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: ''
      })
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const data = await response.json()
      setTasks(tasks.map(task => task.id === taskId ? data.task : task))
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [projectId, viewState.sortBy, viewState.sortOrder, viewState.filters])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchTasks()
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if task is overdue
  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false
    return new Date(task.due_date) < new Date()
  }

  // Group tasks by status for Kanban
  const groupedTasks = statusColumns.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id)
    return acc
  }, {} as Record<string, Task[]>)

  // Task card component
  const TaskCard = ({ task, isDraggable = false }: { task: Task; isDraggable?: boolean }) => {
    const overdue = isOverdue(task)

    return (
      <div
        className="h-full"
      >
        <Card className={`mb-3 cursor-pointer ${overdue ? 'border-red-200' : ''}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-medium line-clamp-2">{task.title}</h4>
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

            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={priorityColors[task.priority]} variant="outline">
                  {task.priority}
                </Badge>
                {viewState.view === 'list' && (
                  <Badge className={statusColors[task.status]} variant="outline">
                    {task.status}
                  </Badge>
                )}
              </div>

              {task.assigned_to && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assigned_user_image} />
                  <AvatarFallback className="text-xs">
                    {task.assigned_user_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                {task.comments_count && task.comments_count > 0 && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{task.comments_count}</span>
                  </div>
                )}
                {task.files_count && task.files_count > 0 && (
                  <div className="flex items-center space-x-1">
                    <Paperclip className="h-3 w-3" />
                    <span>{task.files_count}</span>
                  </div>
                )}
                {task.estimated_hours && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimated_hours}h</span>
                  </div>
                )}
              </div>

              <span className={overdue ? 'text-red-600' : ''}>
                {formatDate(task.due_date)}
              </span>
            </div>

            {overdue && (
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>Overdue</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Kanban column component
  const KanbanColumn = ({ column, tasks: columnTasks }: { column: typeof statusColumns[0]; tasks: Task[] }) => (
    <div
      className="flex-1 min-w-80"
    >
      <div className={`rounded-lg border-2 border-dashed ${column.color} p-1 min-h-96`}>
        <div className="bg-white rounded-md p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">{column.name}</h3>
              <Badge variant="secondary">{columnTasks.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {columnTasks.map((task) => (
            <TaskCard key={task.id} task={task} isDraggable />
          ))}
          {columnTasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No {column.name.toLowerCase()} tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Create task dialog
  const CreateTaskDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Enter task description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: Priority) => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select
              value={newTask.assigned_to}
              onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {/* Team members will be populated from API */}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTask} disabled={!newTask.title.trim()}>
              Create Task
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
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 min-w-80">
              <Skeleton className="h-96 w-full" />
            </div>
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
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-gray-600">Manage project tasks and workflow</p>
        </div>

        <div className="flex items-center space-x-2">
          <CreateTaskDialog />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={viewState.filters.status?.[0] || 'all'}
            onValueChange={(value) =>
              setViewState({
                ...viewState,
                filters: {
                  ...viewState.filters,
                  status: value === 'all' ? undefined : [value as TaskStatus]
                }
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={viewState.filters.priority?.[0] || 'all'}
            onValueChange={(value) =>
              setViewState({
                ...viewState,
                filters: {
                  ...viewState.filters,
                  priority: value === 'all' ? undefined : [value as Priority]
                }
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewState.view === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewState({ ...viewState, view: 'kanban' })}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewState.view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewState({ ...viewState, view: 'list' })}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Task Views */}
      {viewState.view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={groupedTasks[column.id] || []}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating your first task.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      )}
    </div>
  )
}

export default TaskManagement