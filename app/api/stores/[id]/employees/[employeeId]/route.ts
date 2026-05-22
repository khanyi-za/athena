import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// DELETE /stores/:id/employees/:employeeId — remove or cancel an invite.
// Same endpoint serves both per store-frontend-flows §4.5.

type Params = { params: Promise<{ id: string; employeeId: string }> }

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, employeeId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/employees/${employeeId}`,
    {
      method: 'DELETE',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
