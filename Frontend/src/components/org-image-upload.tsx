'use client'

import { useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, X } from 'lucide-react'
import { mediaApi } from '@/lib/api'

const MAX_SIZE_MB = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface OrgAvatarUploadProps {
  /** Current avatar URL (may be null) */
  currentUrl: string | null
  /** Called with the new URL after a successful upload, or null to remove */
  onUploaded: (url: string | null) => void
  /** MinIO context tag used to organise the file in the bucket */
  context: string
  /** Accessible label for the button */
  label?: string
  disabled?: boolean
}

/**
 * Round avatar upload button — same UX as the user avatar upload.
 * Renders a circle with the current image (or an icon) and shows a
 * camera overlay on hover.
 */
export function OrgAvatarUpload({
  currentUrl,
  onUploaded,
  context,
  label = 'Change avatar',
  disabled = false,
}: OrgAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const src = preview ?? currentUrl

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, GIF and WebP are allowed.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB.`)
      return
    }

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setError(null)

    try {
      const media = await mediaApi.upload(file, context)
      onUploaded(media.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      setPreview(null)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onUploaded(null)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="group relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label={label}
          className="border-border focus-visible:ring-ring relative block h-20 w-20 overflow-hidden rounded-full border-2 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed"
        >
          {src ? (
            <img src={src} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
              <Camera className="h-7 w-7" />
            </span>
          )}

          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <Camera size={18} className="text-white" />
            )}
            <span className="text-[10px] leading-none font-medium text-white">
              {uploading ? 'Uploading…' : 'Change'}
            </span>
          </span>
        </button>

        {/* Remove button */}
        {src && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove avatar"
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {error && <p className="text-destructive max-w-[160px] text-center text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface OrgBannerUploadProps {
  /** Current banner URL (may be null) */
  currentUrl: string | null
  /** Called with the new URL after a successful upload, or null to remove */
  onUploaded: (url: string | null) => void
  /** MinIO context tag */
  context: string
  disabled?: boolean
}

/**
 * Wide banner upload zone — shows the current banner image (or a dashed
 * placeholder) with a centred upload button overlay.
 */
export function OrgBannerUpload({
  currentUrl,
  onUploaded,
  context,
  disabled = false,
}: OrgBannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const src = preview ?? currentUrl

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, GIF and WebP are allowed.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB.`)
      return
    }

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setError(null)

    try {
      const media = await mediaApi.upload(file, context)
      onUploaded(media.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      setPreview(null)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onUploaded(null)
  }

  return (
    <div className="space-y-1">
      <div className="group relative h-36 w-full overflow-hidden rounded-lg">
        {/* Background */}
        {src ? (
          <img src={src} alt="Banner" className="h-full w-full object-cover" />
        ) : (
          <div className="border-border bg-muted flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-muted-foreground flex flex-col items-center gap-1">
              <ImagePlus className="h-8 w-8" />
              <span className="text-xs">Upload banner</span>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/30 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
            {uploading ? 'Uploading…' : src ? 'Change banner' : 'Upload banner'}
          </button>

          {src && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-red-600/80"
            >
              <X size={13} />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
