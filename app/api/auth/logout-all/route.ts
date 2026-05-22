import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'
import { COOKIE_NAME } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization')

  if (authorization) {
    await backendFetch('/auth/logout-all', {
      method: 'POST',
      headers: { Authorization: authorization },
    }).catch(() => null)
  }

  const response = NextResponse.json({ message: 'Logged out of all devices' })
  response.cookies.delete(COOKIE_NAME)
  return response
}
