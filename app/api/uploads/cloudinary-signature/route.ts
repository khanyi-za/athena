import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /uploads/cloudinary-signature — proxy for the backend's signing endpoint.
// Backend computes the SHA-1 signature using CLOUDINARY_API_SECRET and returns
// the signed payload the frontend passes to Cloudinary's upload API.
// See docs/Api-frontend-contracts/uploads-module-api.md.

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const { status, data } = await backendFetch('/uploads/cloudinary-signature', {
    method: 'POST',
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  })

  return NextResponse.json(data, { status })
}
