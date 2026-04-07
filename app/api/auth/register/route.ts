import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { status, data } = await backendFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return NextResponse.json(data, { status })
}
