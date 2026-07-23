import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// Start the async catalogue import (creates a ShopifyImportJob to poll).

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const { status, data } = await backendFetch('/shopify/import', {
    method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return NextResponse.json(data, { status })
}
