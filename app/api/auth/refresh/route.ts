import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'
import { COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/server-config'

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(COOKIE_NAME)?.value

  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 })
  }

  const { ok, status, data } = await backendFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })

  if (!ok) {
    const response = NextResponse.json(data, { status })
    response.cookies.delete(COOKIE_NAME)
    return response
  }

  const { accessToken, refreshToken: newRefreshToken, user } = data as {
    accessToken: string
    refreshToken: string
    user: unknown
  }

  const response = NextResponse.json({ accessToken, user })
  response.cookies.set(COOKIE_NAME, newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return response
}
