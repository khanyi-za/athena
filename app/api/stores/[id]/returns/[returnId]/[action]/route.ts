import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /stores/:id/returns/:returnId/(approve|reject|received|close) —
// merchant return-lifecycle actions. Allowlisted here so arbitrary paths
// can't be proxied through.

const ALLOWED_ACTIONS = new Set(['approve', 'reject', 'received', 'close'])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; returnId: string; action: string }> },
) {
  const { id, returnId, action } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { statusCode: 404, message: 'Not found', error: 'Not Found' },
      { status: 404 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const { status, data } = await backendFetch(
    `/stores/${id}/returns/${returnId}/${action}`,
    {
      method: 'POST',
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    },
  )

  return NextResponse.json(data, { status })
}
