import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET /employees/invites/validate?token=<rawToken> — public passthrough.
// No Authorization header required — recipients land here unauthenticated.

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { statusCode: 400, message: 'Missing invite token', error: 'Bad Request' },
      { status: 400 },
    )
  }

  const { status, data } = await backendFetch(
    `/employees/invites/validate?token=${encodeURIComponent(token)}`,
    { method: 'GET' },
  )

  return NextResponse.json(data, { status })
}
