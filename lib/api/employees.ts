import { apiFetch } from '@/lib/api-client'
import {
  employeeMessageResponseSchema,
  employeeStateChangeResponseSchema,
  employeesListResponseSchema,
  inviteEmployeeBodySchema,
  inviteEmployeeResponseSchema,
  type EmployeeStateChangeResponse,
  type EmployeesListResponse,
  type InviteEmployeeBody,
  type InviteEmployeeResponse,
} from '@/lib/schemas/employee'

// Typed client for employee endpoints. All calls hit the Next.js proxy routes
// under /api/stores/:storeId/employees/* so Bearer auth + silent refresh stay
// inside apiFetch. Responses are zod-parsed.

/**
 * GET /stores/:storeId/employees
 *
 * Returns the full team list (pending + active + deactivated). Visible to
 * the owner OR active accepted employees. 403 if not authorised — also the
 * response when the store doesn't exist (enumeration prevention).
 */
export async function getEmployees(storeId: string): Promise<EmployeesListResponse> {
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/employees`, {
    method: 'GET',
  })
  return employeesListResponseSchema.parse(data)
}

/**
 * POST /stores/:storeId/employees — invite a new teammate.
 *
 * Owner-only. Store must be APPROVED or beyond. Two 409 variants the caller
 * must distinguish: already-on-team vs invite-already-pending.
 */
export async function inviteEmployee(
  storeId: string,
  body: InviteEmployeeBody,
): Promise<InviteEmployeeResponse> {
  const validated = inviteEmployeeBodySchema.parse(body)
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/employees`, {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return inviteEmployeeResponseSchema.parse(data)
}

/**
 * POST /stores/:storeId/employees/:employeeId/resend
 *
 * Regenerates the invite token + resends the email. Owner-only. Cannot resend
 * an already-accepted invite (400).
 */
export async function resendInvite(
  storeId: string,
  employeeId: string,
): Promise<{ message: string }> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/employees/${employeeId}/resend`,
    { method: 'POST' },
  )
  return employeeMessageResponseSchema.parse(data)
}

/**
 * POST /stores/:storeId/employees/:employeeId/deactivate
 *
 * Owner-only. Idempotent in spirit — 400 fires only if already deactivated.
 */
export async function deactivateEmployee(
  storeId: string,
  employeeId: string,
): Promise<EmployeeStateChangeResponse> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/employees/${employeeId}/deactivate`,
    { method: 'POST' },
  )
  return employeeStateChangeResponseSchema.parse(data)
}

/**
 * POST /stores/:storeId/employees/:employeeId/reactivate
 *
 * Owner-only. Same shape as deactivate.
 */
export async function reactivateEmployee(
  storeId: string,
  employeeId: string,
): Promise<EmployeeStateChangeResponse> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/employees/${employeeId}/reactivate`,
    { method: 'POST' },
  )
  return employeeStateChangeResponseSchema.parse(data)
}

/**
 * DELETE /stores/:storeId/employees/:employeeId
 *
 * Owner-only. Hard delete — also used to "cancel" a pending invite per
 * store-frontend-flows §4.5 edge note (no separate cancel-invite endpoint).
 */
export async function removeEmployee(
  storeId: string,
  employeeId: string,
): Promise<{ message: string }> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/employees/${employeeId}`,
    { method: 'DELETE' },
  )
  return employeeMessageResponseSchema.parse(data)
}
