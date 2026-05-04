'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { mediaApi, userApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { getFullName } from '@/lib/types'

const MAX_SIZE_MB = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

type Status = 'idle' | 'uploading' | 'success' | 'error'

export function AvatarUpload() {
  const { user, refreshUser } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const avatarSrc = preview ?? user?.avatar ?? null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // -- Client-side validation ------------------------------------------------
    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus('error')
      setMessage('Only JPEG, PNG, GIF and WebP images are allowed.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setStatus('error')
      setMessage(`File must be under ${MAX_SIZE_MB} MB.`)
      return
    }

    // Show instant local preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setStatus('uploading')
    setMessage(null)

    try {
      // 1. Upload to Media-Service → get back the public URL
      const media = await mediaApi.upload(file, 'AVATAR')

      // 2. Persist the URL on the user profile
      await userApi.updateAvatar(media.url)

      // 3. Refresh the auth context so the new avatar shows everywhere
      await refreshUser()

      setStatus('success')
      setMessage('Profile picture updated!')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setPreview(null) // revert preview on error
    } finally {
      // Reset the input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar circle */}
      <div className="group relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
          className="border-border focus-visible:ring-ring relative block h-24 w-24 overflow-hidden rounded-full border-2 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed"
          aria-label="Change profile picture"
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user ? getFullName(user) : 'Avatar'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-2xl font-semibold">
              {initials}
            </span>
          )}

          {/* Overlay */}
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {status === 'uploading' ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : (
              <Camera size={20} className="text-white" />
            )}
            <span className="text-[10px] leading-none font-medium text-white">
              {status === 'uploading' ? 'Uploading…' : 'Change'}
            </span>
          </span>
        </button>

        {/* Status badge */}
        {status === 'success' && (
          <span className="absolute -right-1 -bottom-1 rounded-full bg-green-500 p-0.5">
            <CheckCircle size={14} className="text-white" />
          </span>
        )}
        {status === 'error' && (
          <span className="bg-destructive absolute -right-1 -bottom-1 rounded-full p-0.5">
            <AlertCircle size={14} className="text-white" />
          </span>
        )}
      </div>

      {/* Click-to-upload hint */}
      <p className="text-muted-foreground max-w-[160px] text-center text-xs">
        Click the photo to change it.
        <br />
        Max {MAX_SIZE_MB} MB · JPG / PNG / GIF / WebP
      </p>

      {/* Status message */}
      {message && (
        <p
          className={`text-center text-xs ${
            status === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'
          }`}
        >
          {message}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
