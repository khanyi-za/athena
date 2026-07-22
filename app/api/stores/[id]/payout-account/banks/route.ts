import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET /stores/:id/payout-account/banks — SA bank list (name + Paystack code)
// for the settlement-account form.

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
  const { status, data } = await backendFetch(
    `/stores/${id}/payout-account/banks`,
    { method: 'GET', headers: { Authorization: authorization } },
  )
  return NextResponse.json(data, { status })
}
