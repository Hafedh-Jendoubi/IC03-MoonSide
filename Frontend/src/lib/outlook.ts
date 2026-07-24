/**
 * Helpers for deep-linking into Outlook on the web to start a new email
 * to a colleague, identified by their email address.
 *
 * We use Microsoft's documented Outlook Web App "compose" deep link
 * format:
 *   https://outlook.office.com/mail/deeplink/compose?to=<email>&subject=<text>&body=<text>
 *
 * Opening this URL launches a ready-to-type compose window in Outlook
 * on the web (in the user's existing Microsoft 365 session) with the
 * "To" field already filled in.
 *
 * Reference:
 * https://learn.microsoft.com/microsoft-365/outlook/compose-mail-deep-link
 */

const OUTLOOK_COMPOSE_BASE_URL = 'https://outlook.office.com/mail/deeplink/compose'

export interface OutlookComposeOptions {
  /** Pre-filled subject line. */
  subject?: string
  /** Pre-filled body text. */
  body?: string
}

/**
 * Builds an Outlook Web App deep link that, when opened, starts a new
 * message addressed to the given email address with the compose box
 * ready for the user to type into.
 */
export function getOutlookComposeUrl(email: string, options: OutlookComposeOptions = {}): string {
  const params = new URLSearchParams({ to: email })

  if (options.subject) params.set('subject', options.subject)
  if (options.body) params.set('body', options.body)

  return `${OUTLOOK_COMPOSE_BASE_URL}?${params.toString()}`
}

/**
 * Opens Outlook on the web with a new message ready to go to the given
 * email address.
 *
 * No-ops if no email is provided.
 */
export function openOutlookCompose(
  email: string | null | undefined,
  options?: OutlookComposeOptions
): void {
  if (!email) return
  const url = getOutlookComposeUrl(email, options)
  window.open(url, '_blank', 'noopener,noreferrer')
}
