import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'
import { COOKIE_NAME } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(COOKIE_NAME)?.value
  const authorization = req.headers.get('Authorization')

  if (refreshToken && authorization) {
    await backendFetch('/auth/logout', {
      method: 'POST',
      headers: { Authorization: authorization },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null) // best-effort — cookie is cleared regardless
  }

  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.delete(COOKIE_NAME)
  return response
}
