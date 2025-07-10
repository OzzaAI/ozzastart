'use client'

import React, { useState, useEffect } from 'react'
// import { motion } from "framer-motion"
import {
  MessageSquare,
  Send,
  Edit,
  Trash2,
  MoreVertical,
  AlertTriangle,
  User
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type ProjectComment, type CommentType, type CommentVisibility } from '@/lib/types/projects'

interface CommentManagementProps {
  projectId: string
  userId: string
  userRole: string
}

const CommentManagement: React.FC<CommentManagementProps> = ({ projectId, userId, userRole }) => {
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCommentContent, setNewCommentContent] = useState('')
  const [newCommentType, setNewCommentType] = useState<CommentType>('general')
  const [newCommentVisibility, setNewCommentVisibility] = useState<CommentVisibility>('project')

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        project_id: projectId,
        sort_by: 'created_at',
        sort_order: 'asc'
      })

      const response = await fetch(`/api/projects/${projectId}/comments?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data = await response.json()
      setComments(data.comments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  // Create comment
  const createComment = async () => {
    try {
      const commentData = {
        project_id: projectId,
        content: newCommentContent,
        comment_type: newCommentType,
        visibility: newCommentVisibility,
        author_id: userId
      }

      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      })

      if (!response.ok) {
        throw new Error('Failed to create comment')
      }

      const data = await response.json()
      setComments([...comments, data.comment])
      setNewCommentContent('')
    } catch (err) {
      console.error('Failed to create comment:', err)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [projectId])

  // Format date
  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
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
    <div className="space-y-6"
    >
      {/* New Comment Input */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write your comment here..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            rows={4}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Select
                value={newCommentType}
                onValueChange={(value: CommentType) => setNewCommentType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Comment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newCommentVisibility}
                onValueChange={(value: CommentVisibility) => setNewCommentVisibility(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project Team</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="internal">Internal Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createComment} disabled={!newCommentContent.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <h3 className="text-xl font-bold">All Comments ({comments.length})</h3>
      {comments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
            <p className="text-gray-600">Be the first to leave a comment!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={comment.author_image} />
                      <AvatarFallback>
                        {comment.author_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{comment.author_name || 'Unknown User'}</p>
                          <Badge variant="secondary">{comment.comment_type}</Badge>
                          <Badge variant="outline">{comment.visibility}</Badge>
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
                      <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(comment.created_at)}</p>
                    </div>
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

export default CommentManagement