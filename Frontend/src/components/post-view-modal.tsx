'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { postApi, userApi, PostResponse } from '@/lib/api'
import { PostCard } from '@/components/post-card'
import { User } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

interface PostViewModalProps {
  postId: string
  /** Scroll to and highlight a specific comment on open */
  highlightCommentId?: string
  onClose: () => void
}

export function PostViewModal({ postId, highlightCommentId, onClose }: PostViewModalProps) {
  const { user: currentUser } = useAuth()
  const [post, setPost] = useState<PostResponse | null>(null)
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Fetch post + author
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const p = await postApi.getById(postId)
        if (cancelled) return
        setPost(p)

        // Resolve author
        try {
          const author = await userApi.getById(p.authorId)
          if (!cancelled) setUsersMap({ [p.authorId]: author as unknown as User })
        } catch {
          // author resolution is best-effort
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load post')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [postId])

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Backdrop click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose()
  }

  const seedMap = currentUser
    ? { ...usersMap, [currentUser.id]: currentUser as unknown as User }
    : usersMap

  const modal = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="animate-in fade-in slide-in-from-bottom-4 relative w-full max-w-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-background border-border text-muted-foreground hover:text-foreground absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-md transition-colors"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* Content */}
        {loading && (
          <div className="bg-card border-border flex h-40 items-center justify-center rounded-2xl border shadow-xl">
            <Loader2 className="text-primary h-7 w-7 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-card border-border flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-center shadow-xl">
            <AlertCircle className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && post && currentUser && (
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <PostCard
              post={post}
              currentUserId={currentUser.id}
              usersMap={seedMap}
              onDelete={() => onClose()}
              onUpdate={(updated) => setPost(updated)}
            />
          </div>
        )}
      </div>
    </div>
  )

  // Render into document.body via portal to escape stacking context
  if (typeof window === 'undefined') return null
  return createPortal(modal, document.body)
}
