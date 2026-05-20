'use client'

import { useState, useRef } from 'react'
import { User, getFullName, PostType } from '@/lib/types'
import { ClientPostVisibility, PostRequest, PostResponse } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Globe, Lock, Paperclip, X, FileText, Image, Film, Music, File, Send } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

// ── Type label helpers ────────────────────────────────────────────────────────

const POST_TYPE_LABELS: Record<PostType, { label: string; color: string }> = {
  DISCUSSION: {
    label: 'Discussion',
    color:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    color:
      'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 border-red-200 dark:border-red-900',
  },
  UPDATE: {
    label: 'Update',
    color:
      'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-900',
  },
  QUESTION: {
    label: 'Question',
    color:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  },
  EVENT: {
    label: 'Event',
    color:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border-purple-200 dark:border-purple-900',
  },
  ACHIEVEMENT: {
    label: 'Achievement',
    color:
      'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300 border-orange-200 dark:border-orange-900',
  },
}

const VISIBILITY_OPTIONS: { value: ClientPostVisibility; label: string; icon: React.ReactNode }[] =
  [
    { value: 'PUBLIC', label: 'Public', icon: <Globe size={14} /> },
    { value: 'PRIVATE', label: 'Private', icon: <Lock size={14} /> },
  ]

// ── File icon helper ──────────────────────────────────────────────────────────

function getFileIcon(file: File) {
  const type = file.type
  if (type.startsWith('image/')) return <Image size={14} className="shrink-0 text-blue-500" />
  if (type.startsWith('video/')) return <Film size={14} className="shrink-0 text-purple-500" />
  if (type.startsWith('audio/')) return <Music size={14} className="shrink-0 text-green-500" />
  if (type.includes('pdf') || type.includes('document') || type.includes('text'))
    return <FileText size={14} className="shrink-0 text-orange-500" />
  return <File size={14} className="text-muted-foreground shrink-0" />
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreatePostProps {
  user: User
  /** Called with the freshly-created post so the parent can prepend it. */
  onPostCreate: (post: PostResponse) => void
  /**
   * When rendering inside a team page, pass the team id.
   * The post will be linked to that team and the server will store it as TEAM_ONLY.
   */
  teamId?: string
  /**
   * When rendering inside a department page, pass the department id.
   * The post will be linked to that department and the server will store it as DEPARTMENT_ONLY.
   */
  departmentId?: string
  /**
   * Override the initial visibility selection shown to the user.
   * Defaults to 'PUBLIC' when not provided.
   */
  defaultVisibility?: ClientPostVisibility
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreatePost({
  user,
  onPostCreate,
  teamId,
  departmentId,
  defaultVisibility,
}: CreatePostProps) {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [postType, setPostType] = useState<PostType>('DISCUSSION')
  const [visibility, setVisibility] = useState<ClientPostVisibility>(defaultVisibility ?? 'PUBLIC')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Attachment state
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const firstName = user.firstName || getFullName(user).split(' ')[0]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    // Limit to 10 attachments total
    setPendingFiles((prev) => [...prev, ...files].slice(0, 10))
    // Reset input so the same file can be re-added after removal
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { postApi, attachmentApi } = await import('@/lib/api')

      // 1. Create the post
      const req: PostRequest = {
        content: content.trim(),
        postType,
        postVisibility: visibility,
        // Context ids — the server derives TEAM_ONLY / DEPARTMENT_ONLY from these
        ...(teamId ? { teamId } : {}),
        ...(departmentId ? { departmentId } : {}),
      }
      const created = await postApi.create(req)

      // 2. Upload attachments (in parallel, best-effort)
      if (pendingFiles.length > 0) {
        await Promise.allSettled(pendingFiles.map((f) => attachmentApi.upload(created.id, f)))
        // Re-fetch the post so the returned object includes attachment data
        try {
          const withAttachments = await postApi.getById(created.id)
          onPostCreate(withAttachments)
        } catch {
          onPostCreate(created)
        }
      } else {
        onPostCreate(created)
      }

      // Reset form
      setContent('')
      setIsExpanded(false)
      setPostType('DISCUSSION')
      setPendingFiles([])
    } catch (err) {
      console.error('Failed to create post:', err)
      setError('Failed to publish post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedVisibility = VISIBILITY_OPTIONS.find((o) => o.value === visibility)

  return (
    <Card className="mt-3 mb-6 border-0 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-4 p-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={getFullName(user)}
              className="ring-primary/10 h-12 w-12 rounded-full object-cover ring-2"
            />
          ) : (
            <div className="bg-primary/10 text-primary ring-primary/10 flex h-12 w-12 items-center justify-center rounded-full font-semibold ring-2">
              {user.firstName?.[0]?.toUpperCase()}
              {user.lastName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="flex-1">
          {/* Textarea */}
          <div className="space-y-4">
            <div
              onClick={() => setIsExpanded(true)}
              className="bg-background border-input hover:border-ring/50 cursor-text rounded-lg border px-4 py-3 transition-all duration-200"
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${firstName}?`}
                className="text-foreground placeholder-muted-foreground w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none"
                rows={isExpanded ? 4 : 1}
                maxLength={5000}
              />
            </div>

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium">
                  {pendingFiles.length} attachment{pendingFiles.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((file, i) => (
                    <div
                      key={i}
                      className="border-border bg-muted/30 hover:bg-muted/50 group flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors"
                    >
                      <div className="flex-shrink-0">{getFileIcon(file)}</div>
                      <span className="text-foreground max-w-[120px] truncate font-medium">
                        {file.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-destructive ml-1 opacity-0 transition-all group-hover:opacity-100"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isExpanded && (
              <div className="space-y-4">
                {/* Separator */}
                <Separator />

                {/* Controls Section */}
                <div className="space-y-3">
                  {/* First Row: Post Type & Visibility */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                      <SelectTrigger className="bg-background h-9 w-auto text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(POST_TYPE_LABELS) as PostType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {POST_TYPE_LABELS[t].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={visibility}
                      onValueChange={(v) => setVisibility(v as ClientPostVisibility)}
                    >
                      <SelectTrigger className="bg-background h-9 w-auto text-xs">
                        <span className="flex items-center gap-1">
                          {selectedVisibility?.icon}
                          <span className="hidden sm:inline">{selectedVisibility?.label}</span>
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            <span className="flex items-center gap-2 text-xs">
                              {o.icon}
                              {o.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Badge Preview */}
                    <Badge
                      variant="outline"
                      className={`${POST_TYPE_LABELS[postType].color} border-current text-xs font-medium`}
                    >
                      {POST_TYPE_LABELS[postType].label}
                    </Badge>

                    {/* Character Counter */}
                    <div className="text-muted-foreground ml-auto text-xs font-medium">
                      {content.length}
                      <span className="text-muted-foreground/60">/5000</span>
                    </div>
                  </div>

                  {/* File Attachment Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pendingFiles.length >= 10}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      title={
                        pendingFiles.length >= 10 ? 'Maximum 10 files reached' : 'Attach files'
                      }
                    >
                      <Paperclip size={14} />
                      <span className="hidden sm:inline">
                        {pendingFiles.length > 0 ? `${pendingFiles.length} attached` : 'Attach'}
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/5 border-destructive/20 rounded-md border px-3 py-2">
                    <p className="text-destructive text-xs font-medium">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false)
                      setContent('')
                      setError(null)
                      setPendingFiles([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!content.trim() || isSubmitting}
                    size="sm"
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {pendingFiles.length > 0 ? 'Uploading' : 'Posting'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send size={14} />
                        Post
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </Card>
  )
}
