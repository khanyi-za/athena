import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET history / POST reply for one conversation (canManageStore enforced
// backend-side). POST forwards the Idempotency-Key header.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> },
) {
  const { id, conversationId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const search = req.nextUrl.search
  const { status, data } = await backendFetch(
    `/stores/${id}/conversations/${conversationId}/messages${search}`,
    { method: 'GET', headers: { Authorization: authorization } },
  )

  return NextResponse.json(data, { status })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> },
) {
  const { id, conversationId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const idempotencyKey = req.headers.get('Idempotency-Key')
  const body = await req.json()
  const { status, data } = await backendFetch(
    `/stores/${id}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: authorization,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    },
  )

  return NextResponse.json(data, { status })
}
