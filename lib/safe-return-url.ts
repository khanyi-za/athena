// Open-redirect guard. Auth flows accept a `?returnUrl=` parameter — without
// validation, an attacker could craft `/login?returnUrl=https://evil.com` and
// have the post-auth router happily redirect to a phishing site.
//
// Rules: must start with a single forward slash and a non-slash, no protocol,
// no leading `//` (protocol-relative URL), no whitespace.
//
// Used by login, register, and verify-email.

export const PENDING_RETURN_URL_KEY = 'yiiva_pending_return_url'

export function isSafeReturnUrl(url: string | null | undefined): url is string {
  if (!url) return false
  if (url.length < 2) return false
  if (!url.startsWith('/')) return false
  // Block protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) return false
  // Block any URL containing a protocol
  if (/[a-z]+:\/\//i.test(url)) return false
  // Block whitespace + control chars
  if (/\s/.test(url)) return false
  return true
}

/**
 * Reads + clears the persisted returnUrl from localStorage. Used by
 * verify-email after the user clicks the email link in a new tab — the URL
 * doesn't carry the original returnUrl, so we stashed it at registration time.
 *
 * Returns null on SSR or when nothing was stashed.
 */
export function consumePendingReturnUrl(): string | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(PENDING_RETURN_URL_KEY)
  if (!stored) return null
  window.localStorage.removeItem(PENDING_RETURN_URL_KEY)
  return isSafeReturnUrl(stored) ? stored : null
}

/**
 * Persists a returnUrl for the post-verify-email step. No-op if the URL is
 * unsafe (so we don't store a poisoned value).
 */
export function persistPendingReturnUrl(url: string | null | undefined): void {
  if (typeof window === 'undefined') return
  if (!isSafeReturnUrl(url)) return
  window.localStorage.setItem(PENDING_RETURN_URL_KEY, url)
}
