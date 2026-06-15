'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Users, Building2, FileText, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchApi } from '@/lib/api/services/search'
import type { SearchResult, UserHit, TeamHit, DepartmentHit, PostHit } from '@/lib/api/types/search'

// ── helpers ──────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 7 }: { src?: string; name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClass = `h-${size} w-${size}`

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} flex-shrink-0 rounded-full object-cover`}
      />
    )
  }
  return (
    <div
      className={`${sizeClass} bg-primary text-primary-foreground flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold`}
    >
      {initials}
    </div>
  )
}

function truncate(text: string, max = 80) {
  return text.length > max ? text.slice(0, max) + '…' : text
}

// ── sub-section ───────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1.5 px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase">
      <Icon size={11} />
      {label}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close when clicking outside
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const data = await searchApi.global(q, 4)
      setResults(data)
      setOpen(true)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  function clearSearch() {
    setQuery('')
    setResults(null)
    setOpen(false)
    inputRef.current?.focus()
  }

  function navigate(path: string) {
    setOpen(false)
    setQuery('')
    setResults(null)
    router.push(path)
  }

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.teams.length > 0 ||
      results.departments.length > 0 ||
      results.posts.length > 0)

  const isEmpty = results && !hasResults

  return (
    <div className="relative mx-8 hidden max-w-sm flex-1 lg:flex">
      {/* Input */}
      <div className="relative w-full">
        <Search
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          size={16}
        />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results && setOpen(true)}
          placeholder="Search people, teams, posts…"
          className="bg-muted pr-8 pl-9"
          autoComplete="off"
        />
        {/* Right icon: spinner or clear */}
        <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
          {loading ? (
            <Loader2 size={14} className="text-muted-foreground animate-spin" />
          ) : query ? (
            <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="border-border bg-background animate-slide-down absolute top-full left-0 z-50 mt-1.5 w-full min-w-[340px] rounded-lg border shadow-lg dark:shadow-xl"
        >
          {isEmpty && (
            <div className="text-muted-foreground px-4 py-6 text-center text-sm">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {results && results.users.length > 0 && (
            <section>
              <SectionHeader icon={User} label="People" />
              {results.users.map((u) => (
                <UserRow key={u.id} user={u} onNavigate={() => navigate(`/profile/${u.id}`)} />
              ))}
            </section>
          )}

          {results && results.teams.length > 0 && (
            <section>
              <SectionHeader icon={Users} label="Teams" />
              {results.teams.map((t) => (
                <TeamRow key={t.id} team={t} onNavigate={() => navigate(`/team/${t.id}`)} />
              ))}
            </section>
          )}

          {results && results.departments.length > 0 && (
            <section>
              <SectionHeader icon={Building2} label="Departments" />
              {results.departments.map((d) => (
                <DeptRow key={d.id} dept={d} onNavigate={() => navigate(`/department/${d.id}`)} />
              ))}
            </section>
          )}

          {results && results.posts.length > 0 && (
            <section>
              <SectionHeader icon={FileText} label="Posts" />
              {results.posts.map((p) => (
                <PostRow key={p.id} post={p} onNavigate={() => navigate(`/feed?post=${p.id}`)} />
              ))}
            </section>
          )}

          {hasResults && (
            <div className="border-border border-t p-2">
              <button
                onClick={() => navigate(`/discover?q=${encodeURIComponent(query)}`)}
                className="text-primary hover:bg-muted w-full rounded-md px-3 py-2 text-center text-xs font-medium transition-colors"
              >
                See all results for &ldquo;{query}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── row components ────────────────────────────────────────────────────────────

function UserRow({ user, onNavigate }: { user: UserHit; onNavigate: () => void }) {
  const fullName = `${user.firstName} ${user.lastName}`
  return (
    <button
      onClick={onNavigate}
      className="hover:bg-muted flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
    >
      <Avatar src={user.avatar} name={fullName} size={8} />
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-medium">{fullName}</p>
        {user.jobTitle && <p className="text-muted-foreground truncate text-xs">{user.jobTitle}</p>}
      </div>
    </button>
  )
}

function TeamRow({ team, onNavigate }: { team: TeamHit; onNavigate: () => void }) {
  return (
    <button
      onClick={onNavigate}
      className="hover:bg-muted flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
    >
      <Avatar src={team.avatarUrl} name={team.name} size={8} />
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-medium">{team.name}</p>
        {team.description && (
          <p className="text-muted-foreground truncate text-xs">{truncate(team.description, 50)}</p>
        )}
      </div>
    </button>
  )
}

function DeptRow({ dept, onNavigate }: { dept: DepartmentHit; onNavigate: () => void }) {
  return (
    <button
      onClick={onNavigate}
      className="hover:bg-muted flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
    >
      <Avatar src={dept.avatarUrl} name={dept.name} size={8} />
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-medium">{dept.name}</p>
        {dept.description && (
          <p className="text-muted-foreground truncate text-xs">{truncate(dept.description, 50)}</p>
        )}
      </div>
    </button>
  )
}

function PostRow({ post, onNavigate }: { post: PostHit; onNavigate: () => void }) {
  return (
    <button
      onClick={onNavigate}
      className="hover:bg-muted flex w-full items-start gap-3 px-3 py-2 text-left transition-colors"
    >
      <div className="bg-muted mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
        <FileText size={14} className="text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-foreground line-clamp-2 text-sm">{truncate(post.content, 90)}</p>
        {post.authorName && (
          <p className="text-muted-foreground mt-0.5 text-xs">by {post.authorName}</p>
        )}
      </div>
    </button>
  )
}
