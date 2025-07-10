'use client'

import React, { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { Plus, Search, Filter, Grid, List, Calendar, Users, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import SmartProjectWizard from './SmartProjectWizard'
import { SmartEmptyState } from '@/components/ui/smart-guidance'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'
import { type Project, type ProjectStats, type ProjectFilters, type ProjectViewState } from '@/lib/types/projects'

interface ProjectDashboardProps {
  agencyId: string
  userId: string
  userRole: string
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ agencyId, userId, userRole }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewState, setViewState] = useState<ProjectViewState>({
    view: 'grid',
    filters: {},
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false)

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

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        agency_id: agencyId,
        sort_by: viewState.sortBy,
        sort_order: viewState.sortOrder,
        limit: '50'
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

      const response = await fetch(`/api/projects?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/projects/stats?agency_id=${agencyId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchStats()
  }, [agencyId, viewState.sortBy, viewState.sortOrder, viewState.filters])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchProjects()
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Calculate project progress
  const calculateProgress = (project: Project) => {
    if (!project.task_counts) return 0
    const { completed, total } = project.task_counts
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  // Format currency
  const formatCurrency = (amount?: number, currency = 'USD') => {
    if (!amount) return 'Not set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount / 100)
  }

  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Check if project is overdue
  const isOverdue = (project: Project) => {
    if (!project.due_date || project.status === 'completed') return false
    return new Date(project.due_date) < new Date()
  }

  // Stats cards
  const StatsCards = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6"
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Grid className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold">{stats?.total_projects || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold">{stats?.active_projects || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-bold">{stats?.overdue_tasks || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold">{stats?.total_hours || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // Project card component
  const ProjectCard = ({ project }: { project: Project }) => {
    const progress = calculateProgress(project)
    const overdue = isOverdue(project)

    return (
      <>
      <Link href={`/projects/${project.id}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-full"
        >
          <Card className={`h-full flex flex-col ${overdue ? 'border-red-200' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Badge className={priorityColors[project.priority]}>{project.priority}</Badge>
                  <Badge className={statusColors[project.status]}>{project.status}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-grow space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Project details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Manager</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">
                        {project.project_manager_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{project.project_manager_name || 'Unassigned'}</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600">Due Date</p>
                  <p className={`font-medium mt-1 ${overdue ? 'text-red-600' : ''}`}>
                    {formatDate(project.due_date)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Budget</p>
                  <p className="font-medium mt-1">{formatCurrency(project.budget, project.currency)}</p>
                </div>

                <div>
                  <p className="text-gray-600">Tasks</p>
                  <p className="font-medium mt-1">
                    {project.task_counts?.completed || 0} / {project.task_counts?.total || 0}
                  </p>
                </div>
              </div>

              {/* Team members preview */}
              {project.team_members && project.team_members.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Team</p>
                  <div className="flex -space-x-2">
                    {project.team_members.slice(0, 4).map((member) => (
                      <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                        <AvatarImage src={member.user_image} />
                        <AvatarFallback className="text-xs">
                          {member.user_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.team_members.length > 4 && (
                      <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{project.team_members.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {overdue && (
                <Alert className="border-red-200 bg-red-50">
                  <Calendar className="h-4 w-4 text-red-600" />
                  <span className="text-red-800 text-sm">This project is overdue</span>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Link>
      {/* {progress === 100 && <ConfettiEffect show={true} />} */}
    </>
  )

  // Project list item
  const ProjectListItem = ({ project }: { project: Project }) => {
    const progress = calculateProgress(project)
    const overdue = isOverdue(project)

    return (
      <Link href={`/projects/${project.id}`}>
        <motion.div
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className={`mb-3 ${overdue ? 'border-red-200' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 truncate">{project.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={priorityColors[project.priority]}>{project.priority}</Badge>
                    <Badge className={statusColors[project.status]}>{project.status}</Badge>
                  </div>

                  <div className="text-sm text-right">
                    <p className="text-gray-600">Progress</p>
                    <p className="font-medium">{progress}%</p>
                  </div>

                  <div className="text-sm text-right">
                    <p className="text-gray-600">Due Date</p>
                    <p className={`font-medium ${overdue ? 'text-red-600' : ''}`}>
                      {formatDate(project.due_date)}
                    </p>
                  </div>

                  <div className="text-sm text-right">
                    <p className="text-gray-600">Tasks</p>
                    <p className="font-medium">
                      {project.task_counts?.completed || 0} / {project.task_counts?.total || 0}
                    </p>
                  </div>

                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {project.project_manager_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
        <span className="text-red-800">{error}</span>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsCards />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-600">Manage your agency projects</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsSmartWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
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
                  status: value === 'all' ? undefined : [value as any]
                }
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={viewState.filters.priority?.[0] || 'all'}
            onValueChange={(value) =>
              setViewState({
                ...viewState,
                filters: {
                  ...viewState.filters,
                  priority: value === 'all' ? undefined : [value as any]
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
              variant={viewState.view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewState({ ...viewState, view: 'grid' })}
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

      {/* Projects */}
      {projects.length === 0 ? (
        <SmartEmptyState
          userRole={userRole}
          context="projects"
          onPrimaryAction={() => setIsSmartWizardOpen(true)}
          onSecondaryAction={() => {
            // Show templates or documentation
            console.log('Show templates')
          }}
        />
      ) : (
        <div className={viewState.view === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {projects.map((project) =>
            viewState.view === 'grid' ? (
              <ProjectCard key={project.id} project={project} />
            ) : (
              <ProjectListItem key={project.id} project={project} />
            )
          )}
        </div>
      )}

      {/* Smart Project Wizard */}
      <SmartProjectWizard
        isOpen={isSmartWizardOpen}
        onClose={() => setIsSmartWizardOpen(false)}
        onComplete={(projectData) => {
          console.log('Project created:', projectData);
          setProjects((prevProjects) => [projectData, ...prevProjects]);
          setIsSmartWizardOpen(false);
        }}
        userRole={userRole}
        previousProjects={projects}
      />
    </div>
  );
}

export default ProjectDashboard;