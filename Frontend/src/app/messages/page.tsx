'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Plus, Search } from 'lucide-react'
import { User, getFullName } from '@/lib/types'
import { userApi } from '@/lib/api'

export default function MessagesPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<User[]>([])

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const all = await userApi.getAll()
        setContacts(all.filter((u) => u.id !== user?.id))
      } catch (err) {
        console.error('Failed to load contacts', err)
      }
    }
    fetchContacts()
  }, [user?.id])

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
              {contacts.map((contact, index) => {
                const name = getFullName(contact)
                return (
                  <button
                    key={contact.id}
                    className="hover:bg-muted animate-scale-in flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold">
                        {contact.firstName?.[0]?.toUpperCase()}
                        {contact.lastName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-semibold">{name}</p>
                      {contact.jobTitle && (
                        <p className="text-muted-foreground truncate text-xs">{contact.jobTitle}</p>
                      )}
                    </div>
                  </button>
                )
              })}

              {contacts.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No other users found
                </p>
              )}
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
