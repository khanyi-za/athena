import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// Most recent import job — the wizard's polling target.

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch('/shopify/import/latest', {
    method: 'GET',
    headers: { Authorization: authorization },
  })
  return NextResponse.json(data, { status })
}
