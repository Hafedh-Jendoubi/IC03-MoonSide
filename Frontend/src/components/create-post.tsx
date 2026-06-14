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
import { MentionTextarea } from '@/components/mention-textarea'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  Lock,
  Paperclip,
  X,
  FileText,
  Image,
  Film,
  Music,
  File,
  Plus,
  BarChart2,
  GripVertical,
} from 'lucide-react'

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
  SURVEY: {
    label: 'Survey',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
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

// ── SurveyBuilder ──────────────────────────────────────────────────────────────

interface SurveyBuilderProps {
  question: string
  options: string[]
  onQuestionChange: (q: string) => void
  onOptionsChange: (opts: string[]) => void
}

function SurveyBuilder({
  question,
  options,
  onQuestionChange,
  onOptionsChange,
}: SurveyBuilderProps) {
  const addOption = () => {
    if (options.length < 10) onOptionsChange([...options, ''])
  }

  const updateOption = (idx: number, value: string) => {
    const updated = [...options]
    updated[idx] = value
    onOptionsChange(updated)
  }

  const removeOption = (idx: number) => {
    if (options.length <= 2) return
    onOptionsChange(options.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-800/50 dark:bg-teal-900/10">
      <div className="mb-1 flex items-center gap-2">
        <BarChart2 size={15} className="text-teal-600 dark:text-teal-400" />
        <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
          Survey Builder
        </span>
      </div>

      {/* Question */}
      <input
        type="text"
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        placeholder="Ask a question…"
        maxLength={300}
        className="text-foreground placeholder-muted-foreground w-full rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-400/50 focus:outline-none dark:border-teal-700 dark:bg-slate-800"
      />

      {/* Options */}
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <GripVertical size={14} className="text-muted-foreground shrink-0 cursor-grab" />
            <span className="text-muted-foreground w-5 shrink-0 text-center text-xs font-bold">
              {idx + 1}
            </span>
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              maxLength={150}
              className="border-border text-foreground placeholder-muted-foreground flex-1 rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400/50 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={() => removeOption(idx)}
              disabled={options.length <= 2}
              className="text-muted-foreground hover:text-destructive shrink-0 transition-colors disabled:opacity-30"
              aria-label={`Remove option ${idx + 1}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add option */}
      {options.length < 10 && (
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1.5 text-xs font-medium text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
        >
          <Plus size={13} />
          Add option
          <span className="text-muted-foreground font-normal">({options.length}/10)</span>
        </button>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreatePostProps {
  user: User
  onPostCreate: (post: PostResponse) => void
  teamId?: string
  departmentId?: string
  defaultVisibility?: ClientPostVisibility
  /**
   * When posting into a team or department feed, pass whether the current user
   * is a member of that team/department.  If false the composer is hidden and
   * a "members only" notice is shown instead.  Omit (or pass true) for the
   * global feed where any authenticated user can post.
   */
  isMember?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreatePost({
  user,
  onPostCreate,
  teamId,
  departmentId,
  defaultVisibility,
  isMember = true,
}: CreatePostProps) {
  // If the user is not a member of this team/department, show a notice instead
  // of the full composer so they cannot submit posts.
  if (!isMember && (teamId || departmentId)) {
    return (
      <div className="border-border bg-background text-muted-foreground rounded-xl border p-4 text-center text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
        You must be a member of this {teamId ? 'team' : 'department'} to post here.
      </div>
    )
  }
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [postType, setPostType] = useState<PostType>('DISCUSSION')
  const [visibility, setVisibility] = useState<ClientPostVisibility>(defaultVisibility ?? 'PUBLIC')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Survey state
  const [surveyQuestion, setSurveyQuestion] = useState('')
  const [surveyOptions, setSurveyOptions] = useState<string[]>(['', ''])

  // Attachment state
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const firstName = user.firstName || getFullName(user).split(' ')[0]
  const isSurvey = postType === 'SURVEY'

  const handleTypeChange = (v: PostType) => {
    setPostType(v)
    if (v === 'SURVEY') {
      setSurveyQuestion('')
      setSurveyOptions(['', ''])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setPendingFiles((prev) => [...prev, ...files].slice(0, 10))
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const validateSurvey = (): string | null => {
    if (!surveyQuestion.trim()) return 'Please enter a survey question.'
    const filled = surveyOptions.filter((o) => o.trim().length > 0)
    if (filled.length < 2) return 'Please fill in at least 2 options.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // Validate
    if (isSurvey) {
      const surveyError = validateSurvey()
      if (surveyError) {
        setError(surveyError)
        return
      }
    } else {
      if (!content.trim()) return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { postApi, attachmentApi } = await import('@/lib/api')

      const req: PostRequest = {
        content: content.trim() || (isSurvey ? surveyQuestion.trim() : ''),
        postType,
        postVisibility: visibility,
        ...(teamId ? { teamId } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(isSurvey
          ? {
              surveyQuestion: surveyQuestion.trim(),
              surveyOptions: surveyOptions.filter((o) => o.trim().length > 0),
            }
          : {}),
      }

      const created = await postApi.create(req)

      // Upload attachments (best-effort)
      if (pendingFiles.length > 0) {
        await Promise.allSettled(pendingFiles.map((f) => attachmentApi.upload(created.id, f)))
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
      setSurveyQuestion('')
      setSurveyOptions(['', ''])
    } catch (err) {
      console.error('Failed to create post:', err)
      setError('Failed to publish post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = isSurvey
    ? surveyQuestion.trim().length > 0 && surveyOptions.filter((o) => o.trim()).length >= 2
    : content.trim().length > 0

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
          {/* Collapsed trigger — show survey icon when SURVEY is selected */}
          <div
            onClick={() => setIsExpanded(true)}
            className="bg-muted hover:bg-muted/80 cursor-text rounded-full px-4 py-3 transition-colors dark:bg-slate-800 dark:hover:bg-slate-800/80"
          >
            {!isExpanded && isSurvey ? (
              <div className="text-muted-foreground flex items-center gap-2">
                <BarChart2 size={16} className="text-teal-500" />
                <span className="text-sm">Create a survey…</span>
              </div>
            ) : (
              <MentionTextarea
                value={content}
                onChange={setContent}
                placeholder={
                  isSurvey
                    ? `Add a description (optional)…`
                    : `What's on your mind, ${firstName}? (type @ to mention someone)`
                }
                rows={isExpanded ? (isSurvey ? 2 : 4) : 1}
                maxLength={5000}
                className="resize-none bg-transparent focus:ring-0 focus:outline-none"
              />
            )}
          </div>

          {/* Pending files preview */}
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
              {/* Survey builder */}
              {isSurvey && (
                <SurveyBuilder
                  question={surveyQuestion}
                  options={surveyOptions}
                  onQuestionChange={setSurveyQuestion}
                  onOptionsChange={setSurveyOptions}
                />
              )}

              {/* Controls row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Post type selector */}
                <Select value={postType} onValueChange={(v) => handleTypeChange(v as PostType)}>
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

                {/* Visibility selector */}
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

                {/* Attach file button — hide for survey */}
                {!isSurvey && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pendingFiles.length >= 10}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40"
                      title={
                        pendingFiles.length >= 10 ? 'Maximum 10 files reached' : 'Attach a file'
                      }
                    >
                      <Paperclip size={15} />
                      <span>
                        {pendingFiles.length > 0 ? `${pendingFiles.length} file(s)` : 'Attach'}
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
                  </>
                )}

                {/* Character counter — only for non-survey */}
                {!isSurvey && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {content.length}/5000
                  </span>
                )}
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
                    setSurveyQuestion('')
                    setSurveyOptions(['', ''])
                    setPostType('DISCUSSION')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSubmitting
                    ? isSurvey
                      ? 'Publishing…'
                      : pendingFiles.length > 0
                        ? 'Uploading…'
                        : 'Posting…'
                    : isSurvey
                      ? 'Publish Survey'
                      : 'Post'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  )
}
