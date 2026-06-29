'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Users, Check, X, UserX, UserPlus } from 'lucide-react'
import { connectionApi, ConnectionResponse, UserSummaryResponse } from '@/lib/api'

function initials(u: UserSummaryResponse) {
  const f = u.firstName?.[0] ?? ''
  const l = u.lastName?.[0] ?? ''
  return (f + l).toUpperCase() || u.email?.[0]?.toUpperCase() || '?'
}

function fullName(u: UserSummaryResponse) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return name || u.email || 'Unknown user'
}

function PersonRow({
  user,
  subtitle,
  actions,
}: {
  user: UserSummaryResponse
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-colors">
      <Link href={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-11 w-11">
          {user.avatar && <AvatarImage src={user.avatar} alt={fullName(user)} />}
          <AvatarFallback>{initials(user)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{fullName(user)}</p>
          <p className="text-muted-foreground truncate text-sm">
            {subtitle ?? user.jobTitle ?? ''}
          </p>
        </div>
      </Link>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center">
      {icon}
      <p>{text}</p>
    </div>
  )
}

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<UserSummaryResponse[]>([])
  const [received, setReceived] = useState<ConnectionResponse[]>([])
  const [sent, setSent] = useState<ConnectionResponse[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    try {
      const [conns, recv, snt] = await Promise.all([
        connectionApi.getMyConnections(),
        connectionApi.getPendingReceived(),
        connectionApi.getPendingSent(),
      ])
      setConnections(conns)
      setReceived(recv)
      setSent(snt)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your network')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const withBusy = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id)
    try {
      await action()
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Users className="text-primary" size={28} />
          <div>
            <h1 className="text-2xl font-bold">My Network</h1>
            <p className="text-muted-foreground text-sm">
              Manage your connections and connection requests
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <Tabs defaultValue="connections">
            <TabsList>
              <TabsTrigger value="connections">Connections ({connections.length})</TabsTrigger>
              <TabsTrigger value="received">
                Received {received.length > 0 && `(${received.length})`}
              </TabsTrigger>
              <TabsTrigger value="sent">Sent {sent.length > 0 && `(${sent.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="connections">
              <Card className="p-2">
                {connections.length === 0 ? (
                  <EmptyState
                    icon={<Users size={36} />}
                    text="You haven't connected with anyone yet."
                  />
                ) : (
                  <div className="divide-y">
                    {connections.map((u) => (
                      <PersonRow key={u.id} user={u} />
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="received">
              <Card className="p-2">
                {received.length === 0 ? (
                  <EmptyState
                    icon={<UserPlus size={36} />}
                    text="No pending connection requests."
                  />
                ) : (
                  <div className="divide-y">
                    {received.map((c) =>
                      c.otherUser ? (
                        <PersonRow
                          key={c.id}
                          user={c.otherUser}
                          subtitle="Wants to connect with you"
                          actions={
                            <>
                              <Button
                                size="sm"
                                className="gap-1 bg-green-600 text-white hover:bg-green-700"
                                disabled={busyId === c.id}
                                onClick={() => withBusy(c.id, () => connectionApi.accept(c.id))}
                              >
                                {busyId === c.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === c.id}
                                onClick={() => withBusy(c.id, () => connectionApi.decline(c.id))}
                              >
                                <X size={14} />
                              </Button>
                            </>
                          }
                        />
                      ) : null
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="sent">
              <Card className="p-2">
                {sent.length === 0 ? (
                  <EmptyState
                    icon={<UserPlus size={36} />}
                    text="You have no pending sent requests."
                  />
                ) : (
                  <div className="divide-y">
                    {sent.map((c) =>
                      c.otherUser ? (
                        <PersonRow
                          key={c.id}
                          user={c.otherUser}
                          subtitle="Request pending"
                          actions={
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={busyId === c.id}
                              onClick={() => withBusy(c.id, () => connectionApi.remove(c.id))}
                            >
                              {busyId === c.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserX size={14} />
                              )}
                              Cancel
                            </Button>
                          }
                        />
                      ) : null
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AuthLayout>
  )
}
