import React from 'react'
import { Badge } from '@/components/ui/badge'
import { type ProjectStatus, type Priority, type TaskStatus, type MilestoneStatus } from '@/lib/types/projects'

interface StatusBadgeProps {
  status: ProjectStatus | TaskStatus | MilestoneStatus
  variant?: 'default' | 'outline'
}

interface PriorityBadgeProps {
  priority: Priority
  variant?: 'default' | 'outline'
}

// Project status colors
const projectStatusColors = {
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

// Priority colors
const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
}

export const ProjectStatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'outline' }) => {
  const getStatusColor = (status: string) => {
    if (status in projectStatusColors) {
      return projectStatusColors[status as ProjectStatus]
    }
    if (status in taskStatusColors) {
      return taskStatusColors[status as TaskStatus]
    }
    if (status in milestoneStatusColors) {
      return milestoneStatusColors[status as MilestoneStatus]
    }
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <Badge 
      className={getStatusColor(status)} 
      variant={variant}
    >
      {status.replace('-', ' ').toUpperCase()}
    </Badge>
  )
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, variant = 'outline' }) => {
  return (
    <Badge 
      className={priorityColors[priority]} 
      variant={variant}
    >
      {priority.toUpperCase()}
    </Badge>
  )
}

export default ProjectStatusBadge