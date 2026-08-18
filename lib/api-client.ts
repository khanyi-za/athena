// Client-side only. Do not import in server components or API routes.
import { useAuthStore } from '@/store/auth-store'

async function doFetch(url: string, options: RequestInit, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return fetch(url, { ...options, headers, credentials: 'include' })
}

function redirectToLogin() {
  if (typeof window !== 'undefined') window.location.href = '/login'
}

// ── Single-flight silent refresh ──────────────────────────────────────────────
// Refresh tokens are SINGLE-USE (nuwa rotates on every /auth/refresh). When the
// access token expires on a busy page, many requests 401 simultaneously — if
// each ran its own refresh, the first would rotate the token and every other
// would present the now-revoked one, logging the user out mid-action (and
// racing cookie writes). So ALL concurrent callers share one refresh promise.
// Resolves the new access token, or null when the session is truly dead.
let refreshInFlight: Promise<string | null> | null = null

function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (!res.ok) return null
      const { accessToken } = (await res.json()) as { accessToken: string }
      useAuthStore.getState().setAccessToken(accessToken)
      return accessToken
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { accessToken, clearAuth } = useAuthStore.getState()

  let response = await doFetch(url, options, accessToken)

  if (response.status === 401) {
    const data = await response.json().catch(() => ({})) as { message?: string; code?: string }
    const message = data?.message ?? ''

    if (data?.code === 'SHOPIFY_TOKEN_INVALID') {
      // A 401 about the merchant's SHOPIFY credential, not our session —
      // nuwa rejects a bad/revoked pasted Admin token this way. Logging the
      // user out of YIIVA for it would be wrong; surface it like a normal
      // request error instead.
      throw Object.assign(new Error(message || 'Shopify rejected the access token'), {
        status: 401,
        data,
      })
    }

    if (message === 'Access token has expired') {
      // Silent refresh (single-flight — concurrent 401s share one rotation)
      // then retry. The refresh response carries a slim user — we deliberately
      // do NOT overwrite the full /auth/me user already in the store.
      // Components that need fresh profile data refetch /auth/me explicitly
      // (e.g., on tab focus while in PENDING_REVIEW).
      const newToken = await refreshAccessToken()

      if (newToken) {
        response = await doFetch(url, options, newToken)
      } else {
        clearAuth()
        redirectToLogin()
        throw Object.assign(new Error('Session expired'), { status: 401 })
      }
    } else if (message === 'Account is inactive or does not exist') {
      // Account suspended mid-session — clear state and redirect with context
      clearAuth()
      if (typeof window !== 'undefined') window.location.href = '/login?reason=suspended'
      throw Object.assign(new Error(message), { status: 401 })
    } else {
      // "Authentication required" or "Invalid access token" — hard auth failure
      clearAuth()
      redirectToLogin()
      throw Object.assign(new Error(message || 'Unauthorized'), { status: 401 })
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Something went wrong. Please try again.' })) as {
      message?: string | string[]
    }
    const message = Array.isArray(data.message)
      ? data.message.join('. ')
      : (data.message ?? 'Something went wrong. Please try again.')
    throw Object.assign(new Error(message), { status: response.status, data })
  }

  return response.json() as Promise<T>
}

/**
 * apiFetch variant for binary responses (e.g. waybill PDFs). Same auth +
 * silent-refresh behaviour; returns the raw Blob instead of parsing JSON.
 */
export async function apiFetchBlob(url: string, options: RequestInit = {}): Promise<Blob> {
  const { accessToken, clearAuth } = useAuthStore.getState()

  let response = await doFetch(url, options, accessToken)

  if (response.status === 401) {
    const data = await response.json().catch(() => ({})) as { message?: string }
    const message = data?.message ?? ''

    if (message === 'Access token has expired') {
      const newToken = await refreshAccessToken()
      if (newToken) {
        response = await doFetch(url, options, newToken)
      } else {
        clearAuth()
        redirectToLogin()
        throw Object.assign(new Error('Session expired'), { status: 401 })
      }
    } else {
      clearAuth()
      redirectToLogin()
      throw Object.assign(new Error(message || 'Unauthorized'), { status: 401 })
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: 'Something went wrong. Please try again.' })) as {
      message?: string | string[]
    }
    const message = Array.isArray(data.message)
      ? data.message.join('. ')
      : (data.message ?? 'Something went wrong. Please try again.')
    throw Object.assign(new Error(message), { status: response.status, data })
  }

  return response.blob()
}
