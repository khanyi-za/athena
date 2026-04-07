import { API_URL } from '@/lib/server-config'

interface BackendResult {
  ok: boolean
  status: number
  data: Record<string, unknown>
}

/**
 * Fetches the backend API and safely parses the response.
 * If the backend returns non-JSON (e.g. an HTML 404 page), returns a
 * generic error object instead of throwing a parse error.
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {},
): Promise<BackendResult> {
  let res: Response

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    })
  } catch {
    return {
      ok: false,
      status: 503,
      data: { message: 'Could not reach the backend. Check API_URL in .env.local.' },
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data: Record<string, unknown> = isJson
    ? await res.json()
    : { message: `Unexpected response from server (${res.status} ${res.statusText})` }

  return { ok: res.ok, status: res.status, data }
}
