'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (open) {
      setLoading(true)
      fetchUsers()
        .then(setUsers)
        .catch(() => setUsers([]))
        .finally(() => setLoading(false))
    }
  }, [open, fetchUsers])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No users found</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
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
