'use client'

import React, { useState, useEffect } from 'react'
// import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
  AlertTriangle,
  DollarSign
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
import { type TimeEntry } from '@/lib/types/projects'

interface TimeTrackingProps {
  projectId: string
  userId: string
  userRole: string
}

const TimeTracking: React.FC<TimeTrackingProps> = ({ projectId, userId, userRole }) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBillable, setFilterBillable] = useState<'all' | 'billable' | 'non-billable'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTimeEntry, setNewTimeEntry] = useState({
    description: '',
    hours: 0,
    billable: true,
    started_at: new Date().toISOString().split('T')[0] // YYYY-MM-DD
  })

  // Fetch time entries
  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        project_id: projectId,
        sort_by: 'started_at',
        sort_order: 'desc'
      })

      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      if (filterBillable !== 'all') {
        queryParams.append('billable', filterBillable === 'billable' ? 'true' : 'false')
      }

      const response = await fetch(`/api/projects/${projectId}/time-entries?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch time entries')
      }

      const data = await response.json()
      setTimeEntries(data.timeEntries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load time entries')
    } finally {
      setLoading(false)
    }
  }

  // Create time entry
  const createTimeEntry = async () => {
    try {
      const timeEntryData = {
        ...newTimeEntry,
        project_id: projectId,
        user_id: userId,
        started_at: new Date(newTimeEntry.started_at),
        hours: newTimeEntry.hours * 60 // Convert hours to minutes for storage
      }

      const response = await fetch(`/api/projects/${projectId}/time-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timeEntryData)
      })

      if (!response.ok) {
        throw new Error('Failed to create time entry')
      }

      const data = await response.json()
      setTimeEntries([data.timeEntry, ...timeEntries])
      setIsCreateDialogOpen(false)
      setNewTimeEntry({
        description: '',
        hours: 0,
        billable: true,
        started_at: new Date().toISOString().split('T')[0]
      })
    } catch (err) {
      console.error('Failed to create time entry:', err)
    }
  }

  useEffect(() => {
    fetchTimeEntries()
  }, [projectId, searchQuery, filterBillable])

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Create time entry dialog
  const CreateTimeEntryDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Log Time
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log New Time Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newTimeEntry.description}
              onChange={(e) => setNewTimeEntry({ ...newTimeEntry, description: e.target.value })}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                value={newTimeEntry.hours}
                onChange={(e) => setNewTimeEntry({ ...newTimeEntry, hours: parseFloat(e.target.value) })}
                min="0"
                step="0.25"
              />
            </div>
            <div>
              <Label htmlFor="started_at">Date</Label>
              <Input
                id="started_at"
                type="date"
                value={newTimeEntry.started_at}
                onChange={(e) => setNewTimeEntry({ ...newTimeEntry, started_at: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="billable"
              checked={newTimeEntry.billable}
              onChange={(e) => setNewTimeEntry({ ...newTimeEntry, billable: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="billable">Billable</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTimeEntry} disabled={newTimeEntry.hours <= 0}>
              Log Time
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
        <div className="grid gap-4 md:grid-cols-1">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
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
          <h2 className="text-2xl font-bold">Time Tracking</h2>
          <p className="text-gray-600">Log and manage time spent on project tasks</p>
        </div>

        <div className="flex items-center space-x-2">
          <CreateTimeEntryDialog />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search time entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={filterBillable}
            onValueChange={(value: 'all' | 'billable' | 'non-billable') => setFilterBillable(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Billable Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="billable">Billable</SelectItem>
              <SelectItem value="non-billable">Non-Billable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time Entries List */}
      {timeEntries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No time entries found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterBillable !== 'all' ? 'Try adjusting your search or filters.' : 'Log your first time entry.'}
            </p>
            {!(searchQuery || filterBillable !== 'all') && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log Time
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {timeEntries.map((entry) => (
            <div
              key={entry.id}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{entry.description || 'No description'}</h4>
                      <p className="text-sm text-gray-600">
                        {entry.hours / 60} hours - {entry.user_name} on {formatDate(entry.started_at)}
                      </p>
                      {entry.task_id && (
                        <p className="text-xs text-gray-500">Task: {entry.task_title || entry.task_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className={entry.billable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {entry.billable ? 'Billable' : 'Non-Billable'}
                    </Badge>
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
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimeTracking