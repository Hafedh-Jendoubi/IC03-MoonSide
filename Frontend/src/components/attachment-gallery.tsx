'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Film,
  Music,
  File,
  FileSpreadsheet,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  AlertCircle,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import type { AttachmentResponse } from '@/lib/api'

// ── File type detection (extension-first, contentType as secondary) ───────────

type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'office' | 'other'

const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'avi', 'mkv', 'm4v', 'flv', 'wmv']
const AUDIO_EXTS = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'opus', 'wma', 'oga']
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico']
const OFFICE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp']

function getExt(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function getCategory(contentType: string | null | undefined, fileName: string): FileCategory {
  const ext = getExt(fileName)
  const ct = (contentType ?? '').toLowerCase()

  // Extension takes priority — MIME types from object storage are unreliable
  if (IMAGE_EXTS.includes(ext) || ct.startsWith('image/')) return 'image'
  if (VIDEO_EXTS.includes(ext) || ct.startsWith('video/')) return 'video'
  if (AUDIO_EXTS.includes(ext) || ct.startsWith('audio/')) return 'audio'
  if (ext === 'pdf' || ct === 'application/pdf') return 'pdf'
  if (OFFICE_EXTS.includes(ext)) return 'office'
  return 'other'
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function downloadFile(url: string, fileName: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Image Lightbox ────────────────────────────────────────────────────────────

function LightboxBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}

function ImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: AttachmentResponse[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)
  const current = images[index]

  const reset = () => {
    setZoom(1)
    setRotate(0)
  }
  const prev = () => {
    setIndex((i) => (i - 1 + images.length) % images.length)
    reset()
  }
  const next = () => {
    setIndex((i) => (i + 1) % images.length)
    reset()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/96">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-black/40 px-4 py-3 backdrop-blur-sm">
        <span className="max-w-xs truncate text-sm font-medium text-white/70">
          {index + 1} / {images.length} — {current.fileName}
        </span>
        <div className="flex items-center gap-1">
          <LightboxBtn onClick={() => setZoom((z) => Math.min(z + 0.5, 4))} title="Zoom in">
            <ZoomIn size={17} />
          </LightboxBtn>
          <LightboxBtn onClick={() => setZoom((z) => Math.max(z - 0.5, 0.5))} title="Zoom out">
            <ZoomOut size={17} />
          </LightboxBtn>
          <LightboxBtn onClick={() => setRotate((r) => r + 90)} title="Rotate">
            <RotateCcw size={17} />
          </LightboxBtn>
          <LightboxBtn
            onClick={() => downloadFile(current.fileURL, current.fileName)}
            title="Download"
          >
            <Download size={17} />
          </LightboxBtn>
          <LightboxBtn onClick={onClose} title="Close">
            <X size={17} />
          </LightboxBtn>
        </div>
      </div>

      {/* Image area */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 z-10 rounded-full bg-black/50 p-2.5 text-white transition hover:bg-black/75"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <img
          key={current.id}
          src={current.fileURL}
          alt={current.fileName}
          style={{
            transform: `scale(${zoom}) rotate(${rotate}deg)`,
            transition: 'transform 0.2s ease',
            maxHeight: '80vh',
            maxWidth: '90vw',
            objectFit: 'contain',
          }}
        />

        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-3 z-10 rounded-full bg-black/50 p-2.5 text-white transition hover:bg-black/75"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 bg-black/40 py-3 backdrop-blur-sm">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => {
                setIndex(i)
                reset()
              }}
              className={`h-12 w-12 overflow-hidden rounded-md border-2 transition ${
                i === index ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img.fileURL} alt={img.fileName} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Custom Video Player ───────────────────────────────────────────────────────

function VideoBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}

function VideoPlayer({ attachment }: { attachment: AttachmentResponse }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (playing) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 2500)
    }
  }, [playing])

  useEffect(() => {
    if (!playing) setControlsVisible(true)
  }, [playing])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const handleVolumeChange = (val: number) => {
    const v = videoRef.current
    if (!v) return
    v.volume = val
    v.muted = val === 0
    setVolume(val)
    setMuted(val === 0)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current
    const v = videoRef.current
    if (!bar || !v || !duration) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.currentTime = pct * duration
    setCurrentTime(pct * duration)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const skip = (secs: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs))
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-xl bg-black"
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={attachment.fileURL}
        preload="metadata"
        className="block w-full"
        style={{ maxHeight: '480px', background: '#000' }}
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime)
          const vid = e.currentTarget
          if (vid.buffered.length > 0) {
            setBuffered((vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100)
          }
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => {
          setMuted(e.currentTarget.muted)
          setVolume(e.currentTarget.volume)
        }}
      />

      {/* Big play overlay when paused */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))',
          }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30">
            <Play size={28} className="translate-x-0.5 text-white" fill="white" />
          </div>
        </button>
      )}

      {/* Controls overlay */}
      <div
        className="absolute inset-x-0 bottom-0 transition-all duration-300"
        style={{
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          paddingBottom: isFullscreen ? '16px' : '12px',
        }}
      >
        {/* File name */}
        <div className="px-4 pt-2 pb-1">
          <p className="truncate text-xs font-medium text-white/70">{attachment.fileName}</p>
        </div>

        {/* Progress bar */}
        <div ref={progressRef} className="mx-4 mb-3 cursor-pointer" onClick={seek}>
          <div className="group/bar relative h-1.5 w-full overflow-hidden rounded-full bg-white/20 transition-all hover:h-2.5">
            {/* Buffered */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${buffered}%` }}
            />
            {/* Played */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-1 px-3">
          <VideoBtn onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
          </VideoBtn>

          <VideoBtn onClick={() => skip(-10)} title="Back 10s">
            <SkipBack size={15} />
          </VideoBtn>

          <VideoBtn onClick={() => skip(10)} title="Forward 10s">
            <SkipForward size={15} />
          </VideoBtn>

          <VideoBtn onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
            {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </VideoBtn>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-16 cursor-pointer accent-white"
            style={{ height: '3px' }}
          />

          <span className="ml-1 text-xs text-white/80 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <VideoBtn
            onClick={() => downloadFile(attachment.fileURL, attachment.fileName)}
            title="Download"
          >
            <Download size={16} />
          </VideoBtn>

          <VideoBtn
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </VideoBtn>
        </div>
      </div>
    </div>
  )
}

// ── Audio Player ──────────────────────────────────────────────────────────────

function AudioPlayer({ attachment }: { attachment: AttachmentResponse }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    playing ? el.pause() : el.play()
  }

  return (
    <div className="border-border bg-muted flex items-center gap-3 rounded-xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <audio
        ref={audioRef}
        src={attachment.fileURL}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        muted={muted}
      />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/15">
        <Music size={18} className="text-green-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground mb-1.5 truncate text-sm font-medium">{attachment.fileName}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition hover:bg-green-600"
          >
            {playing ? (
              <Pause size={11} fill="white" />
            ) : (
              <Play size={11} fill="white" className="translate-x-px" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={progress}
            onChange={(e) => {
              const t = Number(e.target.value)
              setProgress(t)
              if (audioRef.current) audioRef.current.currentTime = t
            }}
            className="h-1 flex-1 cursor-pointer accent-green-500"
          />
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {formatTime(progress)} / {formatTime(duration)}
          </span>
          <button
            onClick={() => {
              setMuted((m) => !m)
              if (audioRef.current) audioRef.current.muted = !muted
            }}
            className="text-muted-foreground hover:text-foreground transition"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>
      <button
        onClick={() => downloadFile(attachment.fileURL, attachment.fileName)}
        className="text-muted-foreground hover:text-foreground shrink-0 transition"
        title="Download"
      >
        <Download size={16} />
      </button>
    </div>
  )
}

// ── PDF Viewer ────────────────────────────────────────────────────────────────

function DocBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="text-muted-foreground hover:text-foreground rounded p-1.5 transition hover:bg-black/5 dark:hover:bg-white/5"
    >
      {children}
    </button>
  )
}

function PDFViewer({ attachment }: { attachment: AttachmentResponse }) {
  const [expanded, setExpanded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  return (
    <div className="border-border overflow-hidden rounded-xl border dark:border-slate-700">
      <div className="bg-muted flex items-center gap-3 px-4 py-3 dark:bg-slate-800">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
          <FileText size={18} className="text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">{attachment.fileName}</p>
          <p className="text-muted-foreground text-xs">
            {formatBytes(attachment.fileSizeBytes)} · PDF
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DocBtn onClick={() => setExpanded((e) => !e)} title={expanded ? 'Collapse' : 'Preview'}>
            <Maximize2 size={15} />
          </DocBtn>
          <a
            href={attachment.fileURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground rounded p-1.5 transition hover:bg-black/5 dark:hover:bg-white/5"
            title="Open in tab"
          >
            <ExternalLink size={15} />
          </a>
          <DocBtn
            onClick={() => downloadFile(attachment.fileURL, attachment.fileName)}
            title="Download"
          >
            <Download size={15} />
          </DocBtn>
        </div>
      </div>
      {expanded && (
        <div className="bg-slate-100 dark:bg-slate-900">
          {loadError ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle size={32} className="text-muted-foreground" />
              <p className="text-muted-foreground text-sm">PDF preview unavailable.</p>
              <a
                href={attachment.fileURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm underline"
              >
                Open in new tab
              </a>
            </div>
          ) : (
            <iframe
              src={`${attachment.fileURL}#toolbar=1&navpanes=0`}
              title={attachment.fileName}
              className="h-[600px] w-full border-0"
              onError={() => setLoadError(true)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Office Viewer ─────────────────────────────────────────────────────────────

function OfficeViewer({ attachment }: { attachment: AttachmentResponse }) {
  const [expanded, setExpanded] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const ext = getExt(attachment.fileName)

  const isPpt = ['ppt', 'pptx', 'odp'].includes(ext)
  const isSheet = ['xls', 'xlsx', 'ods', 'csv'].includes(ext)
  const label = isPpt ? 'PowerPoint' : isSheet ? 'Spreadsheet' : 'Document'
  const iconColor = isPpt ? 'text-orange-500' : isSheet ? 'text-green-600' : 'text-blue-500'
  const iconBg = isPpt ? 'bg-orange-500/10' : isSheet ? 'bg-green-500/10' : 'bg-blue-500/10'

  const msViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(attachment.fileURL)}`
  const gViewerUrl = `https://docs.google.com/gstatic/office/view?src=${encodeURIComponent(attachment.fileURL)}`

  return (
    <div className="border-border overflow-hidden rounded-xl border dark:border-slate-700">
      <div className="bg-muted flex items-center gap-3 px-4 py-3 dark:bg-slate-800">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <FileSpreadsheet size={18} className={iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">{attachment.fileName}</p>
          <p className="text-muted-foreground text-xs">
            {formatBytes(attachment.fileSizeBytes)} · {label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DocBtn onClick={() => setExpanded((e) => !e)} title={expanded ? 'Collapse' : 'Preview'}>
            <Maximize2 size={15} />
          </DocBtn>
          <a
            href={attachment.fileURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground rounded p-1.5 transition hover:bg-black/5 dark:hover:bg-white/5"
            title="Open in tab"
          >
            <ExternalLink size={15} />
          </a>
          <DocBtn
            onClick={() => downloadFile(attachment.fileURL, attachment.fileName)}
            title="Download"
          >
            <Download size={15} />
          </DocBtn>
        </div>
      </div>
      {expanded && (
        <iframe
          src={useFallback ? gViewerUrl : msViewerUrl}
          title={attachment.fileName}
          className="h-[520px] w-full border-0 bg-slate-100 dark:bg-slate-900"
          onError={() => !useFallback && setUseFallback(true)}
          allow="fullscreen"
        />
      )}
    </div>
  )
}

// ── Generic File Card ─────────────────────────────────────────────────────────

function GenericFileCard({ attachment }: { attachment: AttachmentResponse }) {
  return (
    <div className="border-border bg-muted flex items-center gap-3 rounded-xl border px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-500/10">
        <File size={18} className="text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-muted-foreground text-xs">{formatBytes(attachment.fileSizeBytes)}</p>
      </div>
      <button
        onClick={() => downloadFile(attachment.fileURL, attachment.fileName)}
        className="text-muted-foreground hover:text-foreground shrink-0 transition"
        title="Download"
      >
        <Download size={16} />
      </button>
    </div>
  )
}

// ── Image Grid ────────────────────────────────────────────────────────────────

function ImageGrid({
  images,
  onImageClick,
}: {
  images: AttachmentResponse[]
  onImageClick: (i: number) => void
}) {
  const count = images.length
  const shown = images.slice(0, Math.min(count, 4))
  const extra = count - 4

  return (
    <div
      className={`grid gap-1.5 overflow-hidden rounded-xl ${count === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
    >
      {shown.map((img, idx) => {
        const isSpanned = count === 3 && idx === 0
        const isLastShown = idx === 3

        return (
          <button
            key={img.id}
            onClick={() => onImageClick(idx)}
            className={`group relative block overflow-hidden rounded-lg ${isSpanned ? 'col-span-2' : ''}`}
            style={{ aspectRatio: count === 1 ? 'auto' : isSpanned ? '2/1' : '1/1' }}
          >
            <img
              src={img.fileURL}
              alt={img.fileName}
              className={`h-full w-full object-cover transition duration-200 group-hover:brightness-90 ${count === 1 ? 'max-h-96' : ''}`}
            />
            {isLastShown && extra > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                <span className="text-2xl font-bold text-white">+{extra}</span>
              </div>
            )}
            {!(isLastShown && extra > 0) && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                <div className="rounded-full bg-black/50 p-2">
                  <ZoomIn size={18} className="text-white" />
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Main AttachmentGallery ────────────────────────────────────────────────────

export function AttachmentGallery({ attachments }: { attachments: AttachmentResponse[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!attachments || attachments.length === 0) return null

  const images = attachments.filter((a) => getCategory(a.contentType, a.fileName) === 'image')
  const videos = attachments.filter((a) => getCategory(a.contentType, a.fileName) === 'video')
  const audios = attachments.filter((a) => getCategory(a.contentType, a.fileName) === 'audio')
  const pdfs = attachments.filter((a) => getCategory(a.contentType, a.fileName) === 'pdf')
  const offices = attachments.filter((a) => getCategory(a.contentType, a.fileName) === 'office')
  const others = attachments.filter((a) => getCategory(a.contentType, a.fileName) === 'other')

  return (
    <div className="mb-4 space-y-3">
      {images.length > 0 && <ImageGrid images={images} onImageClick={setLightboxIndex} />}
      {videos.map((v) => (
        <VideoPlayer key={v.id} attachment={v} />
      ))}
      {audios.map((a) => (
        <AudioPlayer key={a.id} attachment={a} />
      ))}
      {pdfs.map((p) => (
        <PDFViewer key={p.id} attachment={p} />
      ))}
      {offices.map((o) => (
        <OfficeViewer key={o.id} attachment={o} />
      ))}
      {others.map((f) => (
        <GenericFileCard key={f.id} attachment={f} />
      ))}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
