import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// The upstream call pulls + maps the merchant's ENTIRE Shopify catalogue —
// takes seconds on large shops. Keep the route alive past serverless defaults.
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch('/shopify/import/preview', {
    method: 'GET',
    headers: { Authorization: authorization },
  })
  return NextResponse.json(data, { status })
}
