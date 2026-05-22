import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET /categories — public passthrough for the platform-category tree.
// POST /categories — admin only. Backend enforces RolesGuard.

export async function GET() {
  const { status, data } = await backendFetch('/categories', {
    method: 'GET',
  })

  return NextResponse.json(data, { status })
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const { status, data } = await backendFetch('/categories', {
    method: 'POST',
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  })

  return NextResponse.json(data, { status })
}
