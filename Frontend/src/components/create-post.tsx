'use client'

import { useState, useRef } from 'react'
import { User, getFullName, PostType } from '@/lib/types'
import { ClientPostVisibility, PostRequest, PostResponse } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Trash2,
} from 'lucide-react'

// ── Configuration Constants ───────────────────────────────────────────────────

const POST_TYPE_LABELS: Record<PostType, { label: string; color: string }> = {
  DISCUSSION: {
    label: 'Discussion',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
  UPDATE: {
    label: 'Update',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  QUESTION: {
    label: 'Question',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  EVENT: {
    label: 'Event',
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  },
  ACHIEVEMENT: {
    label: 'Achievement',
    color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  },
  SURVEY: {
    label: 'Survey',
    color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  },
}

const VISIBILITY_OPTIONS: { value: ClientPostVisibility; label: string; icon: React.ReactNode }[] =
  [
    { value: 'PUBLIC', label: 'Public', icon: <Globe size={14} /> },
    { value: 'PRIVATE', label: 'Private', icon: <Lock size={14} /> },
  ]

// ── Utility Helpers ──────────────────────────────────────────────────────────

function getFileIcon(file: File) {
  const type = file.type
  if (type.startsWith('image/')) return <Image size={14} className="shrink-0 text-blue-500" />
  if (type.startsWith('video/')) return <Film size={14} className="shrink-0 text-purple-500" />
  if (type.startsWith('audio/')) return <Music size={14} className="shrink-0 text-emerald-500" />
  if (type.includes('pdf') || type.includes('document') || type.includes('text'))
    return <FileText size={14} className="shrink-0 text-orange-500" />
  return <File size={14} className="text-muted-foreground shrink-0" />
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Sub-Component: SurveyBuilder ──────────────────────────────────────────────

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
    <div className="space-y-3 rounded-xl border border-teal-100 bg-teal-50/30 p-4 transition-colors dark:border-teal-900/30 dark:bg-teal-950/10">
      <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
        <BarChart2 size={16} className="shrink-0" />
        <span className="text-xs font-semibold tracking-wider uppercase">Survey Details</span>
      </div>

      <input
        type="text"
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        placeholder="Ask a question..."
        maxLength={300}
        className="bg-background placeholder:text-muted-foreground w-full rounded-lg border border-teal-200/60 px-3.5 py-2 text-sm font-medium shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:outline-none dark:border-teal-800/60"
      />

      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="group flex items-center gap-2">
            <span className="text-muted-foreground/60 w-5 text-center font-mono text-xs">
              {idx + 1}
            </span>
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              maxLength={150}
              className="border-input bg-background flex-1 rounded-lg border px-3 py-1.5 text-sm transition-all focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:outline-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={options.length <= 2}
              onClick={() => removeOption(idx)}
              className="text-muted-foreground hover:text-destructive h-8 w-8 transition-colors disabled:opacity-30"
              aria-label={`Remove option ${idx + 1}`}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>

      {options.length < 10 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addOption}
          className="gap-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/40"
        >
          <Plus size={14} />
          Add Option
          <span className="text-muted-foreground/70 font-normal">({options.length}/10)</span>
        </Button>
      )}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreatePostProps {
  user: User
  onPostCreate: (post: PostResponse) => void
  teamId?: string
  departmentId?: string
  defaultVisibility?: ClientPostVisibility
  isMember?: boolean
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CreatePost({
  user,
  onPostCreate,
  teamId,
  departmentId,
  defaultVisibility,
  isMember = true,
}: CreatePostProps) {
  if (!isMember && (teamId || departmentId)) {
    return (
      <div className="bg-muted/40 text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm shadow-sm">
        You must be a member of this {teamId ? 'team' : 'department'} to publish or interact here.
      </div>
    )
  }

  const [content, setContent] = useState('')
  const [postMentions, setPostMentions] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [postType, setPostType] = useState<PostType>('DISCUSSION')
  const [visibility, setVisibility] = useState<ClientPostVisibility>(defaultVisibility ?? 'PUBLIC')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [surveyQuestion, setSurveyQuestion] = useState('')
  const [surveyOptions, setSurveyOptions] = useState<string[]>(['', ''])
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

  const resetForm = () => {
    setContent('')
    setPostMentions([])
    setIsExpanded(false)
    setPostType('DISCUSSION')
    setPendingFiles([])
    setSurveyQuestion('')
    setSurveyOptions(['', ''])
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (isSurvey) {
      if (!surveyQuestion.trim()) return setError('Please enter a survey question.')
      if (surveyOptions.filter((o) => o.trim()).length < 2)
        return setError('Please fill in at least 2 options.')
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
        mentionedUserIds: postMentions,
        ...(teamId && { teamId }),
        ...(departmentId && { departmentId }),
        ...(isSurvey && {
          surveyQuestion: surveyQuestion.trim(),
          surveyOptions: surveyOptions.filter((o) => o.trim().length > 0),
        }),
      }

      const created = await postApi.create(req)

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

      resetForm()
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
    <Card className="border-border bg-card border p-5 shadow-sm transition-all duration-200 focus-within:shadow-md">
      <div className="flex items-start gap-4">
        {/* User Identity Avatar */}
        <Avatar className="border-muted h-10 w-10 shrink-0 border">
          {user.avatar && <AvatarImage src={user.avatar} alt={getFullName(user)} />}
          <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
            {user.firstName?.[0]?.toUpperCase()}
            {user.lastName?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Input Composer Panel */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <div
            onClick={() => !isExpanded && setIsExpanded(true)}
            className={`rounded-xl transition-colors ${
              isExpanded
                ? 'bg-transparent'
                : 'bg-muted/50 hover:bg-muted cursor-text border border-transparent p-3'
            }`}
          >
            {!isExpanded && isSurvey ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <BarChart2 size={16} className="text-teal-500" />
                <span>Create a survey...</span>
              </div>
            ) : (
              <MentionTextarea
                value={content}
                onChange={setContent}
                onMentionsChange={setPostMentions}
                placeholder={
                  isSurvey
                    ? 'Add an accompanying description (optional)...'
                    : `What's on your mind, ${firstName}? (Type @ to mention teams or peers)`
                }
                rows={isExpanded ? (isSurvey ? 2 : 4) : 1}
                maxLength={5000}
                className="placeholder:text-muted-foreground/70 w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed focus:ring-0 focus:outline-none"
              />
            )}
          </div>

          {/* Core Composer Work Area (Displays conditionally when clicked open) */}
          {isExpanded && (
            <div className="animate-in fade-in space-y-4 duration-200">
              {isSurvey && (
                <SurveyBuilder
                  question={surveyQuestion}
                  options={surveyOptions}
                  onQuestionChange={setSurveyQuestion}
                  onOptionsChange={setSurveyOptions}
                />
              )}

              {/* Attachments Display Section */}
              {pendingFiles.length > 0 && (
                <div className="border-border/60 flex flex-wrap gap-2 border-t pt-2">
                  {pendingFiles.map((file, i) => (
                    <div
                      key={i}
                      className="bg-muted/60 text-foreground/90 hover:bg-muted flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs transition-colors"
                    >
                      {getFileIcon(file)}
                      <span className="max-w-[150px] truncate font-medium">{file.name}</span>
                      <span className="text-muted-foreground/70 font-mono text-[10px]">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-destructive hover:bg-background rounded-md p-0.5 transition-colors"
                        aria-label={`Remove file ${file.name}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Functional Controls Bar */}
              <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Selectors */}
                  <Select value={postType} onValueChange={(v) => handleTypeChange(v as PostType)}>
                    <SelectTrigger className="h-8 w-[140px] text-xs shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(POST_TYPE_LABELS) as PostType[]).map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {POST_TYPE_LABELS[t].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={visibility}
                    onValueChange={(v) => setVisibility(v as ClientPostVisibility)}
                  >
                    <SelectTrigger className="h-8 w-[115px] text-xs shadow-none">
                      <span className="flex items-center gap-1.5">
                        {selectedVisibility?.icon}
                        {selectedVisibility?.label}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">
                          <span className="flex items-center gap-2">
                            {o.icon}
                            {o.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Context Type Dynamic Badge Preview */}
                  <Badge
                    className={`${POST_TYPE_LABELS[postType].color} pointer-events-none h-6 border-0 px-2 py-0.5 text-[11px] font-medium shadow-none`}
                  >
                    {POST_TYPE_LABELS[postType].label}
                  </Badge>

                  {/* Native file upload controller icon toggle link */}
                  {!isSurvey && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={pendingFiles.length >= 10}
                        className="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-2 text-xs"
                        title={
                          pendingFiles.length >= 10
                            ? 'Maximum 10 files reached'
                            : 'Attach records or imagery'
                        }
                      >
                        <Paperclip size={14} />
                        <span>
                          {pendingFiles.length > 0 ? `${pendingFiles.length}/10` : 'Attach'}
                        </span>
                      </Button>
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
                </div>

                {/* Subtext Counter Metric */}
                {!isSurvey && (
                  <span className="text-muted-foreground/60 font-mono text-[11px] tracking-tight">
                    {content.length} / 5000
                  </span>
                )}
              </div>

              {error && (
                <p className="text-destructive bg-destructive/5 rounded-md px-3 py-1.5 text-xs font-medium">
                  {error}
                </p>
              )}

              {/* Component Footer Action Panel */}
              <div className="border-border/40 flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit || isSubmitting}
                  className="h-9 px-4 text-xs font-medium shadow-sm"
                >
                  {isSubmitting ? (
                    <span>
                      {isSurvey
                        ? 'Publishing...'
                        : pendingFiles.length > 0
                          ? 'Uploading...'
                          : 'Posting...'}
                    </span>
                  ) : (
                    <span>{isSurvey ? 'Publish Survey' : 'Publish Post'}</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  )
}
