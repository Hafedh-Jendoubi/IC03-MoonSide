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
import { Globe, Lock, Paperclip, X, FileText, Image, Film, Music, File } from 'lucide-react'

// ── Type label helpers ────────────────────────────────────────────────────────

const POST_TYPE_LABELS: Record<PostType, { label: string; color: string }> = {
  DISCUSSION: {
    label: 'Discussion',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
  UPDATE: {
    label: 'Update',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  QUESTION: {
    label: 'Question',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
  EVENT: {
    label: 'Event',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  ACHIEVEMENT: {
    label: 'Achievement',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
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
    <Card className="animate-fade-in mb-6 p-6">
      <div className="flex gap-4">
        {/* Avatar */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={getFullName(user)}
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold">
            {user.firstName?.[0]?.toUpperCase()}
            {user.lastName?.[0]?.toUpperCase()}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div
            onClick={() => setIsExpanded(true)}
            className="bg-muted hover:bg-muted/80 cursor-text rounded-full px-4 py-3 transition-colors dark:bg-slate-800 dark:hover:bg-slate-800/80"
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${firstName}?`}
              className="text-foreground placeholder-muted-foreground w-full resize-none bg-transparent focus:outline-none"
              rows={isExpanded ? 4 : 1}
              maxLength={5000}
            />
          </div>

          {/* Pending files preview — shown even when collapsed */}
          {pendingFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingFiles.map((file, i) => (
                <div
                  key={i}
                  className="border-border bg-muted flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {getFileIcon(file)}
                  <span className="text-foreground max-w-[140px] truncate font-medium">
                    {file.name}
                  </span>
                  <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-muted-foreground hover:text-destructive ml-1 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isExpanded && (
            <div className="animate-slide-up mt-4 space-y-4">
              {/* Controls row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Post type selector */}
                <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                  <SelectTrigger className="h-8 w-40 text-sm">
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

                {/* Visibility selector — only PUBLIC / PRIVATE */}
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as ClientPostVisibility)}
                >
                  <SelectTrigger className="h-8 w-36 text-sm">
                    <span className="flex items-center gap-1.5">
                      {selectedVisibility?.icon}
                      {selectedVisibility?.label}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="flex items-center gap-2">
                          {o.icon}
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Live preview badge */}
                <Badge className={POST_TYPE_LABELS[postType].color + ' border-0'}>
                  {POST_TYPE_LABELS[postType].label}
                </Badge>

                {/* Attach file button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pendingFiles.length >= 10}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40"
                  title={pendingFiles.length >= 10 ? 'Maximum 10 files reached' : 'Attach a file'}
                >
                  <Paperclip size={15} />
                  <span>
                    {pendingFiles.length > 0 ? `${pendingFiles.length} file(s)` : 'Attach'}
                  </span>
                </button>

                {/* Hidden native file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv"
                />

                {/* Character counter */}
                <span className="text-muted-foreground ml-auto text-xs">{content.length}/5000</span>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
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
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSubmitting ? (pendingFiles.length > 0 ? 'Uploading…' : 'Posting…') : 'Post'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  )
}
