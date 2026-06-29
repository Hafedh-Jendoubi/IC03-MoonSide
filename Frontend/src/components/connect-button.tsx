'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { connectionApi, ConnectionStatusResponse } from '@/lib/api'
import { Check, Loader2, UserCheck, UserPlus, UserX, ChevronDown, X } from 'lucide-react'

interface ConnectButtonProps {
  /** The profile being viewed — i.e. the OTHER user, not the current user. */
  targetUserId: string
  /** Called whenever the relationship changes (connect, accept, decline, remove) — used to refresh the connection count. */
  onChange?: () => void
}

export function ConnectButton({ targetUserId, onChange }: ConnectButtonProps) {
  const [status, setStatus] = useState<ConnectionStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const data = await connectionApi.getStatus(targetUserId)
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connection status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId])

  const runAction = async (action: () => Promise<unknown>) => {
    setActionLoading(true)
    setError(null)
    try {
      await action()
      await fetchStatus()
      onChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <Loader2 size={16} className="animate-spin" />
        Connect
      </Button>
    )
  }

  if (!status || status.status === 'SELF') return null

  const busy = actionLoading

  return (
    <div className="flex flex-col items-end gap-1">
      {status.status === 'NONE' && (
        <Button
          className="bg-primary hover:bg-primary/90 gap-2 text-white"
          disabled={busy}
          onClick={() => runAction(() => connectionApi.sendRequest(targetUserId))}
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          Connect
        </Button>
      )}

      {status.status === 'PENDING_SENT' && (
        <Button
          variant="outline"
          className="gap-2"
          disabled={busy}
          onClick={() =>
            status.connectionId && runAction(() => connectionApi.remove(status.connectionId!))
          }
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
          Pending
          <X size={14} className="text-muted-foreground" />
        </Button>
      )}

      {status.status === 'PENDING_RECEIVED' && (
        <div className="flex gap-2">
          <Button
            className="gap-2 bg-green-600 text-white hover:bg-green-700"
            disabled={busy}
            onClick={() =>
              status.connectionId && runAction(() => connectionApi.accept(status.connectionId!))
            }
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Accept
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={busy}
            onClick={() =>
              status.connectionId && runAction(() => connectionApi.decline(status.connectionId!))
            }
          >
            <UserX size={16} />
            Decline
          </Button>
        </div>
      )}

      {status.status === 'CONNECTED' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
              Connected
              <ChevronDown size={14} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() =>
                status.connectionId && runAction(() => connectionApi.remove(status.connectionId!))
              }
            >
              <UserX size={14} className="mr-2" />
              Remove connection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {error && <p className="max-w-[12rem] text-right text-xs text-red-500">{error}</p>}
    </div>
  )
}
