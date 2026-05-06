'use client'

import { useState } from 'react'
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
import { Globe, Lock } from 'lucide-react'

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

/**
 * Only PUBLIC and PRIVATE are shown to the user.
 * When a post is created inside a team / department feed the server
 * automatically sets TEAM_ONLY / DEPARTMENT_ONLY based on the presence of
 * teamId / departmentId in the request body.
 */
const VISIBILITY_OPTIONS: { value: ClientPostVisibility; label: string; icon: React.ReactNode }[] =
  [
    { value: 'PUBLIC', label: 'Public', icon: <Globe size={14} /> },
    { value: 'PRIVATE', label: 'Private', icon: <Lock size={14} /> },
  ]

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

  const firstName = user.firstName || getFullName(user).split(' ')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { postApi } = await import('@/lib/api')
      const req: PostRequest = {
        content: content.trim(),
        postType,
        postVisibility: visibility,
        // Context ids — the server derives TEAM_ONLY / DEPARTMENT_ONLY from these
        ...(teamId ? { teamId } : {}),
        ...(departmentId ? { departmentId } : {}),
      }
      const created = await postApi.create(req)
      onPostCreate(created)
      setContent('')
      setIsExpanded(false)
      setPostType('DISCUSSION')
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

          {isExpanded && (
            <div className="animate-slide-up mt-4 space-y-4">
              {/* Post type + visibility row */}
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
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSubmitting ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  )
}
