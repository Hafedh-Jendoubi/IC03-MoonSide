'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Send, Search } from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: 'Sarah Johnson',
    lastMessage: 'That sounds great! Let\'s schedule a call.',
    time: '2h ago',
    unread: true,
    avatar: 'SJ',
  },
  {
    id: 2,
    name: 'Michael Chen',
    lastMessage: 'Thanks for the feedback on the proposal.',
    time: '1d ago',
    unread: false,
    avatar: 'MC',
  },
  {
    id: 3,
    name: 'Emma Williams',
    lastMessage: 'Check out the new design system components!',
    time: '3d ago',
    unread: false,
    avatar: 'EW',
  },
];

export default function MessagesPage() {
  const [selectedId, setSelectedId] = React.useState<number | null>(1);

  return (
    <DashboardLayout className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Conversations List */}
          <Card className="md:col-span-1 flex flex-col">
            <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-foreground-secondary" />
                <Input
                  placeholder="Search messages..."
                  className="pl-10"
                />
              </div>

              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full flex gap-3 p-3 rounded transition-colors ${
                      selectedId === conv.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Avatar size="md" initials={conv.avatar} />
                    <div className="flex-1 text-left min-w-0">
                      <p className={`font-medium truncate ${selectedId === conv.id ? 'text-white' : 'text-foreground'}`}>
                        {conv.name}
                      </p>
                      <p className={`text-xs truncate ${selectedId === conv.id ? 'text-white text-opacity-70' : 'text-foreground-secondary'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread && !selectedId && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 hidden md:flex flex-col">
            {selectedId && (
              <>
                {/* Chat Header */}
                <div className="border-b border-border p-4 flex items-center gap-3">
                  <Avatar size="md" initials={conversations.find(c => c.id === selectedId)?.avatar || 'U'} />
                  <div>
                    <p className="font-semibold text-foreground">
                      {conversations.find(c => c.id === selectedId)?.name}
                    </p>
                    <p className="text-xs text-foreground-secondary">Active now</p>
                  </div>
                </div>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded ${
                          idx % 2 === 0
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground'
                            : 'bg-primary text-white'
                        }`}
                      >
                        <p className="text-sm">That sounds great! Let&apos;s schedule a call for next week.</p>
                      </div>
                    </div>
                  ))}
                </CardContent>

                {/* Input Area */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <Input placeholder="Type a message..." />
                    <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
