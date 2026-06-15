import React from 'react'

/**
 * Matches "@Name" patterns in post/comment content.
 * Since we now store display names (not UUIDs), this highlights any
 * word starting with "@" that isn't just a lone "@".
 */
const MENTION_RE = /@([^\s@][^\s]*)/g

/**
 * Converts raw content text into React nodes, highlighting @mentions
 * as styled spans (same visual as Meta / LinkedIn mentions).
 *
 * No user map needed — the display name is already embedded in the content.
 */
export function renderMentions(content: string): React.ReactNode {
  if (!content) return null

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  MENTION_RE.lastIndex = 0

  while ((match = MENTION_RE.exec(content)) !== null) {
    const [fullMatch] = match
    const matchStart = match.index

    // Plain text before this mention
    if (matchStart > lastIndex) {
      parts.push(
        <React.Fragment key={key++}>{content.slice(lastIndex, matchStart)}</React.Fragment>
      )
    }

    parts.push(
      <span key={key++} className="text-primary cursor-pointer font-semibold hover:underline">
        {fullMatch}
      </span>
    )

    lastIndex = matchStart + fullMatch.length
  }

  // Remaining plain text
  if (lastIndex < content.length) {
    parts.push(<React.Fragment key={key++}>{content.slice(lastIndex)}</React.Fragment>)
  }

  return <>{parts}</>
}
