'use client'

import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Plus, Search } from 'lucide-react'
import { mockUsers } from '@/lib/mock-data'

export default function MessagesPage() {
  const { user } = useAuth()

  const conversations = mockUsers.filter((u) => u.id !== user?.id).slice(0, 5)

  return (
    <AuthLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="animate-fade-in mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2 text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Stay in touch with your team</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 gap-2 text-white">
            <Plus size={18} />
            New Message
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Conversation List */}
          <Card className="animate-slide-up p-4 lg:col-span-1">
            <div className="relative mb-4">
              <Search
                className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 transform"
                size={18}
              />
              <Input type="text" placeholder="Search conversations..." className="bg-muted pl-10" />
            </div>

            <div className="space-y-2">
              {conversations.map((conv, index) => (
                <button
                  key={conv.id}
                  className="hover:bg-muted animate-scale-in flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-semibold">{conv.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      Last message preview...
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <Card
            className="animate-slide-up flex min-h-96 flex-col items-center justify-center p-6 lg:col-span-2"
            style={{ animationDelay: '100ms' }}
          >
            <MessageCircle size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-foreground mb-2 text-xl font-semibold">Select a conversation</h2>
            <p className="text-muted-foreground text-center">Choose someone to start messaging</p>
          </Card>
        </div>
      </div>
    </AuthLayout>
  )
}
