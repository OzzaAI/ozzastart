'use client'

import React, { useState, useEffect } from 'react'
// import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  AlertTriangle,
  UploadCloud,
  Edit
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
import { type ProjectFile, type FileVisibility } from '@/lib/types/projects'

interface FileManagementProps {
  projectId: string
  userId: string
  userRole: string
}

const FileManagement: React.FC<FileManagementProps> = ({ projectId, userId, userRole }) => {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterVisibility, setFilterVisibility] = useState<FileVisibility | 'all'>('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [newFile, setNewFile] = useState({
    file_name: '',
    file_url: '',
    description: '',
    visibility: 'project' as FileVisibility
  })

  // File type colors/icons (example, extend as needed)
  const fileTypeColors: Record<string, string> = {
    pdf: 'bg-red-100 text-red-800',
    doc: 'bg-blue-100 text-blue-800',
    docx: 'bg-blue-100 text-blue-800',
    xls: 'bg-green-100 text-green-800',
    xlsx: 'bg-green-100 text-green-800',
    jpg: 'bg-purple-100 text-purple-800',
    png: 'bg-purple-100 text-purple-800',
    default: 'bg-gray-100 text-gray-800'
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || 'default'
  }

  // Fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        project_id: projectId,
        sort_by: 'created_at',
        sort_order: 'desc'
      })

      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      if (filterVisibility !== 'all') {
        queryParams.append('visibility', filterVisibility)
      }

      const response = await fetch(`/api/projects/${projectId}/files?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }

      const data = await response.json()
      setFiles(data.files)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  // Upload file (simplified - in real app, this would involve actual file upload to storage)
  const uploadFile = async () => {
    try {
      const fileData = {
        ...newFile,
        project_id: projectId,
        file_type: getFileExtension(newFile.file_name),
        file_size: 0 // Placeholder, would be actual size from upload
      }

      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileData)
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const data = await response.json()
      setFiles([data.file, ...files])
      setIsUploadDialogOpen(false)
      setNewFile({
        file_name: '',
        file_url: '',
        description: '',
        visibility: 'project'
      })
    } catch (err) {
      console.error('Failed to upload file:', err)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [projectId, searchQuery, filterVisibility])

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Upload file dialog
  const UploadFileDialog = () => (
    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload New File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file_name">File Name</Label>
            <Input
              id="file_name"
              value={newFile.file_name}
              onChange={(e) => setNewFile({ ...newFile, file_name: e.target.value })}
              placeholder="e.g., Project Proposal.pdf"
            />
          </div>

          <div>
            <Label htmlFor="file_url">File URL (for demo)</Label>
            <Input
              id="file_url"
              value={newFile.file_url}
              onChange={(e) => setNewFile({ ...newFile, file_url: e.target.value })}
              placeholder="e.g., https://example.com/file.pdf"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newFile.description}
              onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
              placeholder="Brief description of the file..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={newFile.visibility}
              onValueChange={(value: FileVisibility) => setNewFile({ ...newFile, visibility: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project Team Only</SelectItem>
                <SelectItem value="client">Client & Project Team</SelectItem>
                <SelectItem value="internal">Internal Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={uploadFile} disabled={!newFile.file_name.trim() || !newFile.file_url.trim()}>
              Upload File
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
          <h2 className="text-2xl font-bold">Files</h2>
          <p className="text-gray-600">Manage project documents and assets</p>
        </div>

        <div className="flex items-center space-x-2">
          <UploadFileDialog />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={filterVisibility}
            onValueChange={(value: FileVisibility | 'all') => setFilterVisibility(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="project">Project Team</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterVisibility !== 'all' ? 'Try adjusting your search or filters.' : 'Upload your first project file.'}
            </p>
            {!(searchQuery || filterVisibility !== 'all') && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <UploadCloud className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {files.map((file) => (
            <div
              key={file.id}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-md ${fileTypeColors[getFileExtension(file.file_name)] || fileTypeColors.default}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{file.file_name}</h4>
                      {file.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">{file.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {file.file_type?.toUpperCase()} - {file.file_size ? `${(file.file_size / 1024).toFixed(2)} KB` : 'N/A'} - Uploaded by {file.uploaded_by_name} on {formatDate(file.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{file.visibility}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </DropdownMenuItem>
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

export default FileManagement