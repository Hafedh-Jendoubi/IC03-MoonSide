'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import type { AiTone } from '@/lib/api'
import { SpellCheck2, Wand2, Sparkles, Loader2 } from 'lucide-react'

const TONE_LABELS: Record<AiTone, string> = {
  PROFESSIONAL: 'Professional',
  FRIENDLY: 'Friendly',
  CONCISE: 'Concise',
  ENTHUSIASTIC: 'Enthusiastic',
  FORMAL: 'Formal',
}

interface AiWritingToolsProps {
  /** Current textarea content. */
  content: string
  /** Called with the new text after grammar fix, rewrite, or generation. */
  onApply: (newText: string) => void
  /** Post type, passed as context for better AI-generated paragraphs. */
  postType?: string
  /** Disable all AI actions (e.g. while the form is submitting). */
  disabled?: boolean
  /** Compact icon-only mode for tight spaces (e.g. comment box). */
  compact?: boolean
}

export function AiWritingTools({
  content,
  onApply,
  postType,
  disabled,
  compact,
}: AiWritingToolsProps) {
  const [loadingAction, setLoadingAction] = useState<'grammar' | 'rewrite' | 'generate' | null>(
    null
  )
  const [aiError, setAiError] = useState<string | null>(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateTopic, setGenerateTopic] = useState('')

  const isBusy = loadingAction !== null
  const hasContent = content.trim().length > 0

  const runGrammarFix = async () => {
    if (!hasContent || isBusy) return
    setAiError(null)
    setLoadingAction('grammar')
    try {
      const { aiApi } = await import('@/lib/api')
      const res = await aiApi.fixGrammar({ text: content })
      onApply(res.corrected)
    } catch (err) {
      console.error('Grammar fix failed:', err)
      setAiError('Could not fix grammar right now. Please try again.')
    } finally {
      setLoadingAction(null)
    }
  }

  const runRewrite = async (tone: AiTone) => {
    if (!hasContent || isBusy) return
    setAiError(null)
    setLoadingAction('rewrite')
    try {
      const { aiApi } = await import('@/lib/api')
      const res = await aiApi.rewrite({ text: content, tone })
      onApply(res.rewritten)
    } catch (err) {
      console.error('Rewrite failed:', err)
      setAiError('Could not rewrite this right now. Please try again.')
    } finally {
      setLoadingAction(null)
    }
  }

  const runGenerate = async () => {
    if (!generateTopic.trim() || isBusy) return
    setAiError(null)
    setLoadingAction('generate')
    try {
      const { aiApi } = await import('@/lib/api')
      const res = await aiApi.generate({ topic: generateTopic.trim(), postType })
      onApply(content.trim() ? `${content.trim()}\n\n${res.generated}` : res.generated)
      setGenerateOpen(false)
      setGenerateTopic('')
    } catch (err) {
      console.error('Generate failed:', err)
      setAiError('Could not generate a paragraph right now. Please try again.')
    } finally {
      setLoadingAction(null)
    }
  }

  const btnClass = compact ? 'h-7 gap-1 px-2 text-[11px]' : 'h-8 gap-1.5 px-2 text-xs'

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={runGrammarFix}
        disabled={disabled || isBusy || !hasContent}
        className={`text-muted-foreground hover:text-foreground ${btnClass}`}
        title="Fix grammar and spelling"
      >
        {loadingAction === 'grammar' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <SpellCheck2 size={14} />
        )}
        {!compact && <span>Fix grammar</span>}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isBusy || !hasContent}
            className={`text-muted-foreground hover:text-foreground ${btnClass}`}
            title="Rewrite in a different tone"
          >
            {loadingAction === 'rewrite' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wand2 size={14} />
            )}
            {!compact && <span>Rewrite</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.keys(TONE_LABELS) as AiTone[]).map((tone) => (
            <DropdownMenuItem key={tone} onClick={() => runRewrite(tone)}>
              {TONE_LABELS[tone]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={generateOpen} onOpenChange={setGenerateOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isBusy}
            className={`text-muted-foreground hover:text-foreground ${btnClass}`}
            title="Generate a paragraph with AI"
          >
            {loadingAction === 'generate' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {!compact && <span>Generate</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-2.5">
          <p className="text-xs font-semibold">What's this post about?</p>
          <Textarea
            value={generateTopic}
            onChange={(e) => setGenerateTopic(e.target.value)}
            placeholder="e.g. Announcing our new product launch next Monday..."
            rows={3}
            className="text-sm"
            maxLength={1000}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setGenerateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              disabled={!generateTopic.trim() || isBusy}
              onClick={runGenerate}
            >
              {loadingAction === 'generate' ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {aiError && <span className="text-destructive text-[11px]">{aiError}</span>}
    </div>
  )
}
