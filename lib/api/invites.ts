import { apiFetch } from '@/lib/api-client'
import {
  acceptInviteBodySchema,
  acceptInviteResponseSchema,
  validateInviteResponseSchema,
  type AcceptInviteBody,
  type AcceptInviteResponse,
  type ValidateInviteResponse,
} from '@/lib/schemas/invite'

// Typed client for the employee-invite recipient flow.
//
// validateInvite is intentionally NOT wrapped in apiFetch — apiFetch would
// redirect a 401 to /login, which is wrong for an unauthenticated user
// landing on the public invite page. The validate endpoint is public anyway.

/**
 * GET /employees/invites/validate?token=<token>
 *
 * Public — no auth required. Returns store branding + the email the invite
 * was sent to. 400 with "Invalid or expired invitation" is the only documented
 * non-200 path.
 *
 * Throws an Error with `.status` so the caller can branch on 400 vs other.
 */
export async function validateInvite(token: string): Promise<ValidateInviteResponse> {
  const url = `/api/employees/invites/validate?token=${encodeURIComponent(token)}`
  const res = await fetch(url, { method: 'GET' })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw Object.assign(new Error(body.message ?? 'Validation failed'), {
      status: res.status,
      data: body,
    })
  }

  const data = (await res.json()) as unknown
  return validateInviteResponseSchema.parse(data)
}

/**
 * POST /employees/invites/accept
 *
 * Auth required — the user's email must match the invite email (backend
 * enforces). On success, returns the employee record + a store summary which
 * the caller persists to localStorage for the returning-session flow.
 */
export async function acceptInvite(
  body: AcceptInviteBody,
): Promise<AcceptInviteResponse> {
  const validated = acceptInviteBodySchema.parse(body)
  const data = await apiFetch<unknown>('/api/employees/invites/accept', {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return acceptInviteResponseSchema.parse(data)
}
