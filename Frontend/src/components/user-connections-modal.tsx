'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Search, Users, X } from 'lucide-react'
import { connectionApi, type UserSummaryResponse } from '@/lib/api'

interface UserConnectionsModalProps {
  userId: string
  displayName: string
  onClose: () => void
}

export function UserConnectionsModal({ userId, displayName, onClose }: UserConnectionsModalProps) {
  const [connections, setConnections] = useState<UserSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    connectionApi
      .getUserConnections(userId)
      .then(setConnections)
      .catch((e: any) => setError(e.message ?? 'Failed to load connections'))
      .finally(() => setLoading(false))
  }, [userId])

  const filteredConnections = searchQuery.trim()
    ? connections.filter((u) => {
        const q = searchQuery.toLowerCase()
        return (
          (u.firstName ?? '').toLowerCase().includes(q) ||
          (u.lastName ?? '').toLowerCase().includes(q) ||
          `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q) ||
          (u.jobTitle ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q)
        )
      })
    : connections

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-5 w-5" />
            <h2 className="text-foreground text-lg font-semibold">
              {displayName}&apos;s Connections{' '}
              <span className="text-muted-foreground ml-1 text-base font-normal">
                ({connections.length})
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search bar */}
        {!loading && connections.length > 0 && (
          <div className="border-b px-6 py-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connections by name, role…"
                className="bg-muted/40 focus:ring-primary w-full rounded-lg border py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {!loading && !error && connections.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">No connections yet.</p>
          )}
          {!loading && connections.length > 0 && filteredConnections.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No connections match &quot;{searchQuery}&quot;
            </p>
          )}
          {!loading && filteredConnections.length > 0 && (
            <ul className="space-y-1">
              {filteredConnections.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/profile/${u.id}`}
                    onClick={onClose}
                    className="hover:bg-muted/40 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="bg-muted h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={`${u.firstName} ${u.lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-muted-foreground text-xs font-semibold">
                            {u.firstName?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground text-sm leading-tight font-medium">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`
                          : 'Unknown User'}
                      </p>
                      {u.jobTitle && (
                        <p className="text-muted-foreground truncate text-xs">{u.jobTitle}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end border-t px-6 py-4">
          <button
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
