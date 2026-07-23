import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// Shopify connection (user-scoped — the connection may predate the store).
// Status/body passed through verbatim; nuwa owns all authorization.

const UNAUTHENTICATED = {
  statusCode: 401,
  message: 'Authentication required',
  error: 'Unauthorized',
}

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json(UNAUTHENTICATED, { status: 401 })
  }

  const { status, data } = await backendFetch('/shopify/connection', {
    method: 'GET',
    headers: { Authorization: authorization },
  })
  return NextResponse.json(data, { status })
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json(UNAUTHENTICATED, { status: 401 })
  }

  const body = await req.json()
  const { status, data } = await backendFetch('/shopify/connection', {
    method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return NextResponse.json(data, { status })
}

export async function DELETE(req: NextRequest) {
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json(UNAUTHENTICATED, { status: 401 })
  }

  const { status, data } = await backendFetch('/shopify/connection', {
    method: 'DELETE',
    headers: { Authorization: authorization },
  })
  return NextResponse.json(data, { status })
}
