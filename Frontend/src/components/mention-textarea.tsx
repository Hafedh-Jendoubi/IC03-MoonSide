'use client'

/**
 * MentionTextarea
 * ───────────────
 * Behaves like Meta / Slack mentions:
 *  - User types "@ha" → dropdown shows matching users
 *  - User picks "Hamza Ben Ali" → text becomes "…@Hamza Ben Ali …"  (display name, no UUID)
 *  - The component also tracks the set of mentioned user IDs separately
 *  - Parent gets both via:  onChange(displayText)  +  onMentionsChange(Set<userId>)
 *  - On submit, the parent passes mentionedUserIds[] in the request body so the
 *    backend knows who to notify — no regex parsing needed.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { apiFetch } from '@/lib/api/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MentionUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  jobTitle: string | null
  avatarUrl: string | null
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  /** Called whenever the set of mentioned user IDs changes */
  onMentionsChange?: (mentionedUserIds: string[]) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  className?: string
  /** If true, renders as a single-line <input>, otherwise a <textarea> */
  singleLine?: boolean
  onSubmit?: () => void
  disabled?: boolean
}

export interface MentionTextareaHandle {
  focus: () => void
  /** Reset tracked mentions (call after a successful submit) */
  clearMentions: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(u: MentionUser): string {
  const parts = [u.firstName, u.lastName].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : (u.email ?? u.id)
}

function initials(u: MentionUser): string {
  return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?'
}

/**
 * Walk back from the cursor to find an active "@query" fragment.
 * Returns null if the cursor isn't inside one (e.g. already separated by space).
 */
function getMentionQuery(text: string, cursorPos: number): { query: string; start: number } | null {
  let i = cursorPos - 1
  while (i >= 0) {
    const ch = text[i]
    if (ch === '@') return { query: text.slice(i + 1, cursorPos), start: i }
    if (ch === ' ' || ch === '\n') break
    i--
  }
  return null
}

/**
 * Replace the "@query" fragment (from start to cursorPos) with "@Display Name ".
 */
function replaceMentionFragment(
  text: string,
  start: number,
  cursorPos: number,
  user: MentionUser
): { newText: string; newCursor: number } {
  const token = `@${displayName(user)} `
  const newText = text.slice(0, start) + token + text.slice(cursorPos)
  return { newText, newCursor: start + token.length }
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function MentionDropdown({
  users,
  loading,
  activeIdx,
  onSelect,
}: {
  users: MentionUser[]
  loading: boolean
  activeIdx: number
  onSelect: (u: MentionUser) => void
}) {
  if (!loading && users.length === 0) return null

  return (
    <div
      className="border-border bg-background absolute z-50 mt-1 w-64 overflow-hidden rounded-xl border shadow-xl dark:border-slate-700 dark:bg-slate-900"
      role="listbox"
      aria-label="Mention suggestions"
    >
      {loading ? (
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="border-primary inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground text-sm">Searching…</span>
        </div>
      ) : (
        <ul className="max-h-52 overflow-y-auto py-1">
          {users.map((u, idx) => (
            <li key={u.id} role="option" aria-selected={idx === activeIdx}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault() // keep focus on the input
                  onSelect(u)
                }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                  idx === activeIdx
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={displayName(u)}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary/10 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {initials(u)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{displayName(u)}</p>
                  {u.jobTitle && (
                    <p className="text-muted-foreground truncate text-xs">{u.jobTitle}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const MentionTextarea = forwardRef<MentionTextareaHandle, MentionTextareaProps>(
  function MentionTextarea(
    {
      value,
      onChange,
      onMentionsChange,
      placeholder,
      maxLength = 2000,
      rows = 3,
      className = '',
      singleLine = false,
      onSubmit,
      disabled = false,
    },
    ref
  ) {
    const inputRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [users, setUsers] = useState<MentionUser[]>([])
    const [loading, setLoading] = useState(false)
    const [activeIdx, setActiveIdx] = useState(0)
    const [open, setOpen] = useState(false)
    const mentionStartRef = useRef<number | null>(null)

    /**
     * Tracks userId → displayName for every mention confirmed in this session.
     * We use a Map so we can efficiently expose the IDs list.
     */
    const mentionMapRef = useRef<Map<string, string>>(new Map())

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clearMentions: () => {
        mentionMapRef.current.clear()
        onMentionsChange?.([])
      },
    }))

    // Close dropdown on outside click
    useEffect(() => {
      function handler(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [])

    const search = useCallback(async (query: string) => {
      if (query.length === 0) {
        setUsers([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const data = await apiFetch<MentionUser[]>(
          `/posts/mentions/search?q=${encodeURIComponent(query)}`
        )
        setUsers(data ?? [])
        setActiveIdx(0)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const newVal = e.target.value
      const cursor = e.target.selectionStart ?? newVal.length
      onChange(newVal)

      const mentionInfo = getMentionQuery(newVal, cursor)
      if (mentionInfo) {
        mentionStartRef.current = mentionInfo.start
        setOpen(true)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(mentionInfo.query), 250)
      } else {
        setOpen(false)
        mentionStartRef.current = null
        setUsers([])
      }
    }

    const handleSelect = (user: MentionUser) => {
      const el = inputRef.current
      if (!el || mentionStartRef.current === null) return

      const cursor = el.selectionStart ?? value.length
      const { newText, newCursor } = replaceMentionFragment(
        value,
        mentionStartRef.current,
        cursor,
        user
      )

      // Track the mentioned user
      mentionMapRef.current.set(user.id, displayName(user))
      onMentionsChange?.(Array.from(mentionMapRef.current.keys()))

      onChange(newText)
      setOpen(false)
      setUsers([])
      mentionStartRef.current = null

      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(newCursor, newCursor)
      })
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (!open) {
        if (singleLine && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          onSubmit?.()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, users.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (users[activeIdx]) handleSelect(users[activeIdx])
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    const sharedProps = {
      ref: inputRef as any,
      value,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      placeholder,
      maxLength,
      disabled,
      className: `bg-muted text-foreground placeholder-muted-foreground focus:ring-primary/30 w-full text-sm focus:ring-2 focus:outline-none dark:bg-slate-800 ${className}`,
      'aria-autocomplete': 'list' as const,
      'aria-expanded': open,
    }

    return (
      <div ref={containerRef} className="relative w-full">
        {singleLine ? (
          <input type="text" {...sharedProps} />
        ) : (
          <textarea {...sharedProps} rows={rows} />
        )}

        {open && (
          <MentionDropdown
            users={users}
            loading={loading}
            activeIdx={activeIdx}
            onSelect={handleSelect}
          />
        )}
      </div>
    )
  }
)
