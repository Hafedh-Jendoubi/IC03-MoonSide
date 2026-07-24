/**
 * Helpers for deep-linking into Microsoft Teams to start a 1:1 chat with
 * a colleague, identified by their email address (their Teams/Entra ID
 * is effectively their email in most tenants).
 *
 * We use Microsoft's documented "deep link to a chat" format:
 *   https://teams.microsoft.com/l/chat/0/0?users=<email>&message=<text>
 *
 * Opening this URL:
 *  - Launches the Teams desktop app directly if it's installed and the
 *    OS/browser has the teams.microsoft.com protocol handed off to it
 *    (this is the standard behavior once a user has the desktop app
 *    set up — Teams registers itself to intercept these links).
 *  - Otherwise falls back to opening the chat in teams.microsoft.com in
 *    the browser.
 *
 * Reference:
 * https://learn.microsoft.com/microsoftteams/platform/concepts/build-and-test/deep-links#deep-link-to-a-specific-chat
 */

const TEAMS_CHAT_BASE_URL = 'https://teams.microsoft.com/l/chat/0/0'

export interface TeamsChatOptions {
  /** Text to pre-fill in the message compose box. */
  message?: string
}

/**
 * Builds a Microsoft Teams deep link that, when opened, starts (or
 * resumes) a 1:1 chat with the given email address and focuses the
 * compose box so the user is ready to type and send.
 */
export function getTeamsChatUrl(email: string, options: TeamsChatOptions = {}): string {
  // IMPORTANT: Microsoft's documented examples use the email address with a
  // literal "@" in the query string (e.g. "users=joe@contoso.com"). Running
  // the email through URLSearchParams/encodeURIComponent turns "@" into
  // "%40", which the Teams client does not reliably decode before doing the
  // user lookup — it then fails to match anyone and leaves "To:" empty.
  // So we only encode characters that actually need it, and explicitly
  // restore "@" afterwards.
  const usersParam = encodeURIComponent(email).replace(/%40/g, '@')

  let url = `${TEAMS_CHAT_BASE_URL}?users=${usersParam}`

  if (options.message) {
    url += `&message=${encodeURIComponent(options.message)}`
  }

  return url
}

/**
 * Opens Microsoft Teams (desktop app if installed and registered as the
 * protocol handler, otherwise the web client) with a chat against the
 * given email address ready to go.
 *
 * No-ops if no email is provided.
 */
export function openTeamsChat(email: string | null | undefined, options?: TeamsChatOptions): void {
  if (!email) return
  const url = getTeamsChatUrl(email, options)
  window.open(url, '_blank', 'noopener,noreferrer')
}
