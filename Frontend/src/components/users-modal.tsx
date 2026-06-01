'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ModalUser {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string | null
  jobTitle: string | null
  emoji?: string
}

interface UsersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fetchUsers: () => Promise<ModalUser[]>
}

export function UsersModal({ open, onOpenChange, title, fetchUsers }: UsersModalProps) {
  const [users, setUsers] = useState<ModalUser[]>([])
  const [loading, setLoading] = useState(false)
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      setActiveEmoji(null)
      fetchUsers()
        .then(setUsers)
        .catch(() => setUsers([]))
        .finally(() => setLoading(false))
    }
  }, [open, fetchUsers])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Collect unique emojis that actually appear in the list, preserving order
  const emojiFilters = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const u of users) {
      if (u.emoji && !seen.has(u.emoji)) {
        seen.add(u.emoji)
        result.push(u.emoji)
      }
    }
    return result
  }, [users])

  const hasFilters = emojiFilters.length > 1

  const visibleUsers = useMemo(
    () => (activeEmoji ? users.filter((u) => u.emoji === activeEmoji) : users),
    [users, activeEmoji]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Emoji filter bar — only shown when there are multiple reaction types */}
        {!loading && hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <button
              onClick={() => setActiveEmoji(null)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activeEmoji === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              All
            </button>
            {emojiFilters.map((emoji) => {
              const count = users.filter((u) => u.emoji === emoji).length
              return (
                <button
                  key={emoji}
                  onClick={() => setActiveEmoji(activeEmoji === emoji ? null : emoji)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    activeEmoji === emoji
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No users found</div>
          ) : (
            <div className="space-y-2">
              {visibleUsers.map((user) => (
                <div
                  key={user.id}
                  className="hover:bg-accent flex items-center gap-3 rounded-lg p-3 transition-colors"
                >
                  <Avatar className="size-10 shrink-0">
                    {user.avatar && (
                      <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                    )}
                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      {user.emoji && <span className="text-lg">{user.emoji}</span>}
                    </div>
                    <p className="text-muted-foreground truncate text-sm">{user.email}</p>
                    {user.jobTitle && (
                      <p className="text-muted-foreground text-xs">{user.jobTitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
