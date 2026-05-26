'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { PostResponse, AttachmentResponse, PostRequest, postApi, attachmentApi } from '@/lib/api'
import { PostType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  X,
  Check,
  Paperclip,
  Trash2,
  Image,
  Film,
  Music,
  FileText,
  File,
  Plus,
  BarChart2,
  GripVertical,
  Globe,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const POST_TYPE_CONFIG: Record<PostType, { label: string; color: string }> = {
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

// ── File helpers ──────────────────────────────────────────────────────────────

function getFileIcon(file: File) {
  const t = file.type
  if (t.startsWith('image/')) return <Image size={14} className="shrink-0 text-blue-500" />
  if (t.startsWith('video/')) return <Film size={14} className="shrink-0 text-purple-500" />
  if (t.startsWith('audio/')) return <Music size={14} className="shrink-0 text-green-500" />
  if (t.includes('pdf') || t.includes('document') || t.includes('text'))
    return <FileText size={14} className="shrink-0 text-orange-500" />
  return <File size={14} className="text-muted-foreground shrink-0" />
}

function getAttachmentIcon(a: AttachmentResponse) {
  const t = a.contentType ?? ''
  if (t.startsWith('image/')) return <Image size={14} className="shrink-0 text-blue-500" />
  if (t.startsWith('video/')) return <Film size={14} className="shrink-0 text-purple-500" />
  if (t.startsWith('audio/')) return <Music size={14} className="shrink-0 text-green-500" />
  if (t.includes('pdf') || t.includes('document') || t.includes('text'))
    return <FileText size={14} className="shrink-0 text-orange-500" />
  return <File size={14} className="text-muted-foreground shrink-0" />
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── SurveyEditor ──────────────────────────────────────────────────────────────

interface SurveyEditorProps {
  question: string
  options: string[]
  onQuestionChange: (q: string) => void
  onOptionsChange: (opts: string[]) => void
}

function SurveyEditor({ question, options, onQuestionChange, onOptionsChange }: SurveyEditorProps) {
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
      <div className="flex items-center gap-2">
        <BarChart2 size={15} className="text-teal-600 dark:text-teal-400" />
        <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
          Survey Settings
        </span>
      </div>

      {/* Question input */}
      <div className="space-y-1">
        <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Question
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="Ask a question…"
          maxLength={300}
          className="text-foreground placeholder-muted-foreground w-full rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-400/50 focus:outline-none dark:border-teal-700 dark:bg-slate-800"
        />
      </div>

      {/* Options */}
      <div className="space-y-1">
        <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Options
        </label>
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
      </div>

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

export interface EditPostModalProps {
  post: PostResponse
  onClose: () => void
  onSaved: (updated: PostResponse) => void
}

// ── Main component ────────────────────────────────────────────────────────────

export function EditPostModal({ post, onClose, onSaved }: EditPostModalProps) {
  // ── Core post state ──────────────────────────────────────────────────────
  const [content, setContent] = useState(post.content ?? '')
  const [postType, setPostType] = useState<PostType>(post.postType as PostType)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    post.postVisibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
  )

  // ── Attachment state ─────────────────────────────────────────────────────
  const [existingAttachments, setExistingAttachments] = useState<AttachmentResponse[]>(
    post.attachments ?? []
  )
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<Set<string>>(new Set())
  const [newFiles, setNewFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Survey state ─────────────────────────────────────────────────────────
  const [surveyQuestion, setSurveyQuestion] = useState(post.survey?.surveyQuestion ?? '')
  const [surveyOptions, setSurveyOptions] = useState<string[]>(() => {
    if (post.survey?.options && post.survey.options.length >= 2) {
      return post.survey.options.map((o) => o.text)
    }
    return ['', '']
  })

  // ── UI state ─────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const isSurvey = postType === 'SURVEY'
  const totalAttachments =
    existingAttachments.filter((a) => !attachmentsToDelete.has(a.id)).length + newFiles.length

  // Load attachments if not already loaded
  useEffect(() => {
    if (post.attachments && post.attachments.length > 0) {
      setExistingAttachments(post.attachments)
      return
    }
    attachmentApi
      .list(post.id)
      .then((list) => setExistingAttachments(list))
      .catch(() => {})
  }, [post.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleTypeChange = (v: PostType) => {
    setPostType(v)
    setError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 10 - totalAttachments
    setNewFiles((prev) => [...prev, ...files.slice(0, remaining)])
    e.target.value = ''
  }

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const toggleDeleteExisting = (id: string) => {
    setAttachmentsToDelete((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const validate = (): string | null => {
    if (isSurvey) {
      if (!surveyQuestion.trim()) return 'Please enter a survey question.'
      const filled = surveyOptions.filter((o) => o.trim().length > 0)
      if (filled.length < 2) return 'A survey needs at least 2 options.'
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError(null)

    try {
      // 1. Update post metadata
      const req: PostRequest = {
        content: content.trim(),
        postType: postType,
        postVisibility: visibility,
        teamId: post.teamId ?? undefined,
        departmentId: post.departmentId ?? undefined,
        isPinned: post.isPinned,
        isAIGenerated: post.isAIGenerated,
        ...(isSurvey && {
          surveyQuestion: surveyQuestion.trim(),
          surveyOptions: surveyOptions.filter((o) => o.trim().length > 0),
        }),
      }
      const updated = await postApi.update(post.id, req)

      // 2. Delete removed attachments
      if (attachmentsToDelete.size > 0) {
        await Promise.allSettled(
          [...attachmentsToDelete].map((id) => attachmentApi.delete(post.id, id))
        )
      }

      // 3. Upload new attachments
      if (newFiles.length > 0) {
        await Promise.allSettled(
          newFiles.map((file) =>
            attachmentApi.upload(post.id, file, (pct) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: pct }))
            })
          )
        )
      }

      // 4. Fetch the final post state (with updated attachments)
      const finalPost = await postApi.getById(post.id)

      onSaved(finalPost)
      onClose()
    } catch (e: any) {
      console.error('Failed to update post:', e)
      setError(e?.message ?? 'Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const activeAttachments = existingAttachments.filter((a) => !attachmentsToDelete.has(a.id))

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit post"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-background border-border w-full max-w-2xl rounded-2xl border shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-6 py-4 dark:border-slate-700">
            <h2 className="text-foreground text-lg font-semibold">Edit Post</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[calc(100vh-12rem)] space-y-5 overflow-y-auto px-6 py-5">
            {/* ── Post type + visibility row ── */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[160px] flex-1 space-y-1">
                <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Post type
                </label>
                <Select value={postType} onValueChange={(v) => handleTypeChange(v as PostType)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <Badge className={`${POST_TYPE_CONFIG[t].color} border-0 text-xs`}>
                            {POST_TYPE_CONFIG[t].label}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px] flex-1 space-y-1">
                <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Visibility
                </label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as 'PUBLIC' | 'PRIVATE')}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <span className="flex items-center gap-1.5">
                      {visibility === 'PUBLIC' ? <Globe size={14} /> : <Lock size={14} />}
                      {visibility === 'PUBLIC' ? 'Public' : 'Private'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">
                      <span className="flex items-center gap-2">
                        <Globe size={14} />
                        Public
                      </span>
                    </SelectItem>
                    <SelectItem value="PRIVATE">
                      <span className="flex items-center gap-2">
                        <Lock size={14} />
                        Private
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-0.5">
                <Badge className={`${POST_TYPE_CONFIG[postType].color} border-0`}>
                  {POST_TYPE_CONFIG[postType].label}
                </Badge>
              </div>
            </div>

            {/* ── Content textarea ── */}
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {isSurvey ? 'Description (optional)' : 'Content'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                rows={isSurvey ? 2 : 5}
                placeholder={
                  isSurvey ? 'Add more context about your survey…' : "What's on your mind?"
                }
                autoFocus
                className="bg-muted text-foreground placeholder-muted-foreground focus:ring-primary/30 w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed focus:ring-2 focus:outline-none dark:bg-slate-800"
              />
              <div className="flex justify-end">
                <span className="text-muted-foreground text-xs">{content.length}/5000</span>
              </div>
            </div>

            {/* ── Survey editor (only for SURVEY type) ── */}
            {isSurvey && (
              <SurveyEditor
                question={surveyQuestion}
                options={surveyOptions}
                onQuestionChange={setSurveyQuestion}
                onOptionsChange={setSurveyOptions}
              />
            )}

            {/* ── Attachments section (only for non-survey posts) ── */}
            {!isSurvey && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Attachments
                  </label>
                  <span className="text-muted-foreground text-xs">{totalAttachments}/10</span>
                </div>

                {/* Existing attachments */}
                {existingAttachments.length > 0 && (
                  <div className="space-y-1.5">
                    {existingAttachments.map((a) => {
                      const isMarkedForDelete = attachmentsToDelete.has(a.id)
                      return (
                        <div
                          key={a.id}
                          className={`border-border flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-all dark:border-slate-700 ${
                            isMarkedForDelete
                              ? 'bg-destructive/5 border-destructive/30 opacity-60'
                              : 'bg-muted dark:bg-slate-800'
                          }`}
                        >
                          {getAttachmentIcon(a)}
                          <span
                            className={`text-foreground flex-1 truncate font-medium ${isMarkedForDelete ? 'line-through' : ''}`}
                          >
                            {a.fileName}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            {formatBytes(a.fileSizeBytes)}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleDeleteExisting(a.id)}
                            className={`shrink-0 transition-colors ${
                              isMarkedForDelete
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-muted-foreground hover:text-destructive'
                            }`}
                            title={isMarkedForDelete ? 'Undo remove' : 'Remove attachment'}
                            aria-label={isMarkedForDelete ? 'Undo remove' : 'Remove attachment'}
                          >
                            {isMarkedForDelete ? (
                              <span className="text-xs font-medium">Undo</span>
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* New files to upload */}
                {newFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {newFiles.map((file, i) => (
                      <div
                        key={i}
                        className="border-border bg-muted flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                      >
                        {getFileIcon(file)}
                        <span className="text-foreground flex-1 truncate font-medium">
                          {file.name}
                          <span className="text-primary ml-1.5 font-normal">New</span>
                        </span>
                        {uploadProgress[file.name] !== undefined &&
                          uploadProgress[file.name] < 100 && (
                            <span className="text-primary text-xs tabular-nums">
                              {Math.round(uploadProgress[file.name])}%
                            </span>
                          )}
                        <span className="text-muted-foreground shrink-0">
                          {formatBytes(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeNewFile(i)}
                          className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add file button */}
                {totalAttachments < 10 && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
                    >
                      <Paperclip size={15} />
                      <span>Add attachment</span>
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

                {existingAttachments.length === 0 && newFiles.length === 0 && (
                  <p className="text-muted-foreground text-xs italic">No attachments</p>
                )}
              </div>
            )}

            {/* ── Error message ── */}
            {error && (
              <div className="text-destructive flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm dark:bg-red-900/20">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-border flex items-center justify-between border-t px-6 py-4 dark:border-slate-700">
            <p className="text-muted-foreground text-xs">
              {attachmentsToDelete.size > 0 && (
                <span className="text-destructive font-medium">
                  {attachmentsToDelete.size} attachment{attachmentsToDelete.size > 1 ? 's' : ''}{' '}
                  will be removed
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={14} className="mr-1.5" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
