import React from 'react'
import Link from 'next/link'
import { User } from '@/lib/types'

/**
 * Matches @{uuid} mention tokens embedded in post / comment content.
 * The UUID format is 8-4-4-4-12 hex digits separated by dashes.
 */
const MENTION_TOKEN_RE = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi

/**
 * Converts a raw content string that may contain `@{uuid}` mention tokens
 * into React nodes.  Each token is rendered as a highlighted, clickable link
 * to the mentioned user's profile page.
 *
 * Falls back to `@Unknown` when the user cannot be resolved from `usersMap`.
 *
 * @param content  - Raw text that may contain @{uuid} tokens
 * @param usersMap - Map of userId → User for name resolution
 */
export function renderMentions(content: string, usersMap: Record<string, User>): React.ReactNode {
  if (!content) return null

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  MENTION_TOKEN_RE.lastIndex = 0

  while ((match = MENTION_TOKEN_RE.exec(content)) !== null) {
    const [fullMatch, userId] = match
    const matchStart = match.index

    // Plain text before this mention
    if (matchStart > lastIndex) {
      parts.push(
        <React.Fragment key={key++}>{content.slice(lastIndex, matchStart)}</React.Fragment>
      )
    }

    const user = usersMap[userId]
    const name = user
      ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unknown'
      : 'Unknown'

    parts.push(
      <Link
        key={key++}
        href={`/profile/${userId}`}
        className="text-primary hover:text-primary/80 font-semibold transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        @{name}
      </Link>
    )

    lastIndex = matchStart + fullMatch.length
  }

  // Any remaining plain text
  if (lastIndex < content.length) {
    parts.push(<React.Fragment key={key++}>{content.slice(lastIndex)}</React.Fragment>)
  }

  return <>{parts}</>
}
