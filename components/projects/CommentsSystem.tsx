'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, 
  Send, 
  Reply, 
  Edit, 
  Trash2, 
  MoreVertical,
  Heart,
  Flag,
  At,
  Paperclip,
  Smile,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import { type ProjectComment, type CommentType, type CommentVisibility, type CreateCommentData } from '@/lib/types/projects'

interface CommentsSystemProps {
  projectId: string
  taskId?: string
  deliverableId?: string
  userId: string
  userRole: string
}

const CommentsSystem: React.FC<CommentsSystemProps> = ({ 
  projectId, 
  taskId, 
  deliverableId, 
  userId, 
  userRole 
}) => {
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [commentType, setCommentType] = useState<CommentType>('general')
  const [commentVisibility, setCommentVisibility] = useState<CommentVisibility>('project')
  const [filterType, setFilterType] = useState('all')
  const [filterVisibility, setFilterVisibility] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Comment type colors
  const commentTypeColors = {
    general: 'bg-blue-100 text-blue-800 border-blue-200',
    approval: 'bg-green-100 text-green-800 border-green-200',
    feedback: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    internal: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Visibility colors
  const visibilityColors = {
    project: 'bg-blue-100 text-blue-800 border-blue-200',
    client: 'bg-green-100 text-green-800 border-green-200',
    internal: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        limit: '50'
      })

      if (taskId) {
        queryParams.append('task_id', taskId)
      } else if (deliverableId) {
        queryParams.append('deliverable_id', deliverableId)
      } else {
        queryParams.append('project_id', projectId)
      }

      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      if (filterType !== 'all') {
        queryParams.append('comment_type', filterType)
      }

      if (filterVisibility !== 'all') {
        queryParams.append('visibility', filterVisibility)
      }

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
  const createComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const commentData: CreateCommentData = {
        content: content.trim(),
        comment_type: commentType,
        visibility: commentVisibility,
        project_id: !taskId && !deliverableId ? projectId : undefined,
        task_id: taskId,
        deliverable_id: deliverableId,
        parent_comment_id: parentId
      }

      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      const data = await response.json()
      
      if (parentId) {
        // Add reply to parent comment
        setComments(prev => prev.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: [data.comment, ...(comment.replies || [])] }
            : comment
        ))
      } else {
        // Add new top-level comment
        setComments(prev => [data.comment, ...prev])
      }

      // Reset form
      setNewComment('')
      setReplyTo(null)
      setCommentType('general')
    } catch (err) {
      console.error('Failed to create comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update comment
  const updateComment = async (commentId: string, content: string) => {
    if (!content.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: content.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      const data = await response.json()
      
      // Update comment in state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? data.comment
          : {
              ...comment,
              replies: comment.replies?.map(reply => 
                reply.id === commentId ? data.comment : reply
              )
            }
      ))

      setEditingComment(null)
      setEditContent('')
    } catch (err) {
      console.error('Failed to update comment:', err)
    }
  }

  // Delete comment
  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      // Remove comment from state
      setComments(prev => prev.filter(comment => {
        if (comment.id === commentId) return false
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply.id !== commentId)
        }
        return true
      }))
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  // Format date
  const formatDate = (date: Date | string) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diffInHours = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return commentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: commentDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  // Auto-resize textarea
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  useEffect(() => {
    fetchComments()
  }, [projectId, taskId, deliverableId, filterType, filterVisibility])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchComments()
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Focus on reply textarea when replying
  useEffect(() => {
    if (replyTo && replyTextareaRef.current) {
      replyTextareaRef.current.focus()
    }
  }, [replyTo])

  // Comment component
  const Comment = ({ comment, isReply = false }: { comment: ProjectComment; isReply?: boolean }) => {
    const canEdit = comment.author_id === userId || userRole === 'admin'
    const canDelete = comment.author_id === userId || userRole === 'admin'

    return (
      <div className={`${isReply ? 'ml-12 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author_image} />
            <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">{comment.author_name}</span>
              <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              <Badge className={commentTypeColors[comment.comment_type]} variant="outline">
                {comment.comment_type}
              </Badge>
              {comment.visibility !== 'project' && (
                <Badge className={visibilityColors[comment.visibility]} variant="outline">
                  {comment.visibility}
                </Badge>
              )}
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value)
                    adjustTextareaHeight(e.target)
                  }}
                  className="min-h-20 resize-none"
                  placeholder="Edit your comment..."
                />
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => updateComment(comment.id, editContent)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null)
                      setEditContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-900 whitespace-pre-wrap mb-2">{comment.content}</p>
                
                <div className="flex items-center space-x-4 text-sm">
                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setReplyTo(comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}

                  {(canEdit || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-500">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingComment(comment.id)
                              setEditContent(comment.content)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reply form */}
        {replyTo === comment.id && (
          <div className="mt-3 ml-11">
            <div className="space-y-2">
              <Textarea
                ref={replyTextareaRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value)
                  adjustTextareaHeight(e.target)
                }}
                className="min-h-20 resize-none"
                placeholder="Write a reply..."
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Select value={commentType} onValueChange={(value: CommentType) => setCommentType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="approval">Approval</SelectItem>
                      {userRole !== 'client' && (
                        <SelectItem value="internal">Internal</SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {userRole !== 'client' && (
                    <Select value={commentVisibility} onValueChange={(value: CommentVisibility) => setCommentVisibility(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setReplyTo(null)
                      setNewComment('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => createComment(newComment, comment.id)}
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <Comment key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <MessageSquare className="h-6 w-6 mr-2" />
            Comments & Communication
          </h2>
          <p className="text-gray-600">
            {taskId ? 'Task discussion' : 
             deliverableId ? 'Deliverable feedback' : 
             'Project communication'}
          </p>
        </div>
        <Badge variant="secondary">{comments.length} comments</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>

          {userRole !== 'client' && (
            <Select value={filterVisibility} onValueChange={setFilterVisibility}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* New Comment Form */}
      {!replyTo && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value)
                  adjustTextareaHeight(e.target)
                }}
                className="min-h-24 resize-none"
                placeholder="Write a comment or ask a question..."
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Select value={commentType} onValueChange={(value: CommentType) => setCommentType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="approval">Approval</SelectItem>
                      {userRole !== 'client' && (
                        <SelectItem value="internal">Internal</SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {userRole !== 'client' && (
                    <Select value={commentVisibility} onValueChange={(value: CommentVisibility) => setCommentVisibility(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button 
                  onClick={() => createComment(newComment)}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filterType !== 'all' || filterVisibility !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Start the conversation by posting the first comment.'
                }
              </p>
              {!searchQuery && filterType === 'all' && filterVisibility === 'all' && (
                <Button onClick={() => textareaRef.current?.focus()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-6">
                <Comment comment={comment} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default CommentsSystem