import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'
import { COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ok, status, data } = await backendFetch('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!ok) return NextResponse.json(data, { status })

  const { accessToken, refreshToken } = data as {
    accessToken: string
    refreshToken: string
  }

  // Fetch full user profile including store status
  const { ok: meOk, data: meData } = await backendFetch('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const user = meOk ? meData : (data as { user: unknown }).user

  const response = NextResponse.json({ accessToken, user })
  response.cookies.set(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return response
}
