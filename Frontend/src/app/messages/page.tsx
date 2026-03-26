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

  const conversations = mockUsers.filter(u => u.id !== user?.id).slice(0, 5)

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
            <p className="text-muted-foreground">Stay in touch with your team</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus size={18} />
            New Message
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <Card className="lg:col-span-1 p-4 animate-slide-up">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Search conversations..."
                className="pl-10 bg-muted"
              />
            </div>

            <div className="space-y-2">
              {conversations.map((conv, index) => (
                <button
                  key={conv.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{conv.name}</p>
                    <p className="text-xs text-muted-foreground truncate">Last message preview...</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 p-6 flex flex-col items-center justify-center min-h-96 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <MessageCircle size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h2>
            <p className="text-muted-foreground text-center">Choose someone to start messaging</p>
          </Card>
        </div>
      </div>
    </AuthLayout>
  )
}
