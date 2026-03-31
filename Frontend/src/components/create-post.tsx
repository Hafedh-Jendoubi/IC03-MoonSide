'use client'

import { useState } from 'react'
import { User, getFullName } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Smile, Image, FileText } from 'lucide-react'

interface CreatePostProps {
  user: User
  onPostCreate: (content: string) => void
}

export function CreatePost({ user, onPostCreate }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onPostCreate(content)
      setContent('')
      setIsExpanded(false)
    }
  }

  const firstName = user.firstName || getFullName(user).split(' ')[0]

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
              rows={isExpanded ? 3 : 1}
            />
          </div>

          {isExpanded && (
            <div className="animate-slide-up mt-4">
              <div className="mb-4 flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-2"
                >
                  <Image size={18} />
                  Photo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-2"
                >
                  <FileText size={18} />
                  Document
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-2"
                >
                  <Smile size={18} />
                  Emoji
                </Button>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsExpanded(false)
                    setContent('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!content.trim()}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Post
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Card>
  )
}
