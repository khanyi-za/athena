import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET/POST /stores/:id/payout-account — merchant settlement account for
// Paystack split payouts. Bank details pass through to nuwa → Paystack;
// nuwa persists only the subaccount code + display metadata. nuwa enforces
// canManageStore (404-not-403).

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }
  const { status, data } = await backendFetch(`/stores/${id}/payout-account`, {
    method: 'GET',
    headers: { Authorization: authorization },
  })
  return NextResponse.json(data, { status })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }
  const body = await req.json()
  const { status, data } = await backendFetch(`/stores/${id}/payout-account`, {
    method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return NextResponse.json(data, { status })
}
