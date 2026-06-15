'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Notification } from '@/lib/types'
import { notificationsApi } from '@/lib/api'
import { tokenStorage } from '@/lib/api/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  fetchMore: () => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  latestPush: Notification | null
  clearLatestPush: () => void
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [latestPush, setLatestPush] = useState<Notification | null>(null)

  const isMountedRef = useRef(true)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const retryDelayRef = useRef(1000)

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    isMountedRef.current = true
    loadPage(0, true)
    loadUnreadCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // ── SSE connection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    isMountedRef.current = true

    const token = tokenStorage.getAccessToken()
    if (token) openSSE(token)

    return () => {
      isMountedRef.current = false
      readerRef.current?.cancel().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const openSSE = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/stream`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })

      if (!res.ok || !res.body) {
        scheduleReconnect()
        return
      }

      // Successful connection — reset retry delay
      retryDelayRef.current = 1000

      const reader = res.body.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      let buf = ''

      while (isMountedRef.current) {
        const { value, done } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })

        // SSE frames are separated by double newlines
        const frames = buf.split('\n\n')
        buf = frames.pop() ?? ''

        for (const frame of frames) {
          if (!frame.trim()) continue

          let eventName = ''
          let data = ''

          for (const line of frame.split('\n')) {
            if (line.startsWith(':')) continue // heartbeat comment — ignore
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            if (line.startsWith('data:')) data = line.slice(5).trim()
          }

          if (eventName === 'notification' && data) {
            try {
              const notif: Notification = JSON.parse(data)
              if (isMountedRef.current) handlePush(notif)
            } catch {
              /* ignore parse errors */
            }
          }
        }
      }

      // Stream ended cleanly — reconnect
      if (isMountedRef.current) scheduleReconnect()
    } catch {
      if (isMountedRef.current) scheduleReconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scheduleReconnect = useCallback(() => {
    const delay = retryDelayRef.current
    // Exponential backoff capped at 30s
    retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000)

    setTimeout(() => {
      if (!isMountedRef.current) return
      const token = tokenStorage.getAccessToken()
      if (token) openSSE(token)
    }, delay)
  }, [openSSE])

  const handlePush = useCallback((notif: Notification) => {
    setNotifications((prev) => (prev.find((n) => n.id === notif.id) ? prev : [notif, ...prev]))
    setUnreadCount((c) => c + 1)
    setLatestPush(notif)
  }, [])

  // ── Data helpers ───────────────────────────────────────────────────────────
  const loadPage = useCallback(
    async (pageNum: number, reset = false) => {
      if (!userId) return
      setIsLoading(true)
      try {
        const data = await notificationsApi.getNotifications(pageNum, 20)
        if (!isMountedRef.current) return
        setNotifications((prev) => (reset ? data.content : [...prev, ...data.content]))
        setHasMore(pageNum < data.totalPages - 1)
        setPage(pageNum)
      } catch {
        /* ignore */
      } finally {
        setIsLoading(false)
      }
    },
    [userId]
  )

  const loadUnreadCount = useCallback(async () => {
    if (!userId) return
    try {
      const { count } = await notificationsApi.getUnreadCount()
      if (isMountedRef.current) setUnreadCount(count)
    } catch {
      /* ignore */
    }
  }, [userId])

  const fetchMore = useCallback(() => {
    if (!isLoading && hasMore) loadPage(page + 1)
  }, [isLoading, hasMore, page, loadPage])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    await notificationsApi.markAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await notificationsApi.markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [])

  const deleteNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id)
      await notificationsApi.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1))
    },
    [notifications]
  )

  const clearLatestPush = useCallback(() => setLatestPush(null), [])

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    latestPush,
    clearLatestPush,
  }
}
