'use client'

import { useState } from 'react'
import { User } from '@/lib/types'
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

  return (
    <Card className="p-6 mb-6 animate-fade-in">
      <div className="flex gap-4">
        {/* Avatar */}
        <img
          src={user.avatar}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div
            onClick={() => setIsExpanded(true)}
            className="bg-muted rounded-full px-4 py-3 cursor-text hover:bg-muted/80 transition-colors"
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
              className="w-full bg-transparent text-foreground placeholder-muted-foreground resize-none focus:outline-none"
              rows={isExpanded ? 3 : 1}
            />
          </div>

          {/* Action Buttons */}
          {isExpanded && (
            <div className="mt-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <Image size={18} />
                  Photo
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <FileText size={18} />
                  Document
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground gap-2">
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
