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

  return fetch(url, { ...options, headers })
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { accessToken, setAuth, clearAuth } = useAuthStore.getState()

  let response = await doFetch(url, options, accessToken)

  // Handle 401 — check whether it's an expired token or a hard auth failure
  if (response.status === 401) {
    const data = await response.json().catch(() => ({})) as { message?: string }

    if (data?.message === 'Access token has expired') {
      // Attempt a single silent refresh
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })

      if (refreshRes.ok) {
        const { accessToken: newToken, user } = await refreshRes.json()
        setAuth(newToken, user)
        // Retry the original request once with the new token
        response = await doFetch(url, options, newToken)
      } else {
        clearAuth()
        if (typeof window !== 'undefined') window.location.href = '/login'
        throw Object.assign(new Error('Session expired'), { status: 401 })
      }
    } else {
      // Any other 401 — invalid token, no token, suspended account
      clearAuth()
      if (typeof window !== 'undefined') window.location.href = '/login'
      throw Object.assign(new Error(data?.message ?? 'Unauthorized'), { status: 401 })
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
