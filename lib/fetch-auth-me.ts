import { userSchema } from '@/lib/schemas/auth'
import type { User } from '@/types/auth'

/**
 * Fetches the authenticated user's full profile via /api/auth/me and validates
 * the shape against the auth-module contract.
 *
 * Pass the access token explicitly — used right after login / verify-email / refresh
 * when the new token may not yet be readable from the auth store.
 *
 * Returns null on any failure (network error, non-200, or schema mismatch) so callers
 * can degrade gracefully (fall back to the slim user from the auth response).
 */
export async function fetchAuthMe(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
    if (!res.ok) return null

    const json = await res.json()
    const parsed = userSchema.safeParse(json)
    if (!parsed.success) {
      // The backend returned 200 but the shape doesn't match. Worth surfacing —
      // either the contract changed or we have a bug.
      console.error('[fetchAuthMe] /auth/me response failed schema validation', parsed.error)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}
