import React from 'react'

/**
 * Wire format: @[Full Name]
 * This lets us store the full name with spaces in plain text
 * and survive round-trips through the backend.
 *
 * Example stored value:
 *   "Hello @[Jendoubi Majdi], how are you?"
 */
const MENTION_TOKEN_RE = /@\[([^\]]+)\]/g

interface MentionSpanProps {
  name: string
}

function MentionSpan({ name }: MentionSpanProps) {
  return <span className="text-primary font-semibold">@{name}</span>
}

/**
 * Converts raw content that may contain @[Name](userId) tokens into React nodes.
 * Each token becomes a styled, clickable span that navigates to the user's profile.
 * Plain text between tokens is left unchanged.
 */
export function renderMentions(content: string): React.ReactNode {
  if (!content) return null

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  MENTION_TOKEN_RE.lastIndex = 0

  while ((match = MENTION_TOKEN_RE.exec(content)) !== null) {
    const [fullMatch, name] = match
    const matchStart = match.index

    if (matchStart > lastIndex) {
      parts.push(
        <React.Fragment key={key++}>{content.slice(lastIndex, matchStart)}</React.Fragment>
      )
    }

    parts.push(<MentionSpan key={key++} name={name} />)

    lastIndex = matchStart + fullMatch.length
  }

  if (lastIndex < content.length) {
    parts.push(<React.Fragment key={key++}>{content.slice(lastIndex)}</React.Fragment>)
  }

  return <>{parts}</>
}
