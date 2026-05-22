import { z } from 'zod'

// Employee-invite recipient flow. Mirrors
// docs/Api-frontend-contracts/store-module-api.md §"Employee Invite Flow".
//
// Two endpoints sit under /employees/invites/* because the recipient only
// has a token at this stage — they don't yet know the store ID.

// ----------------------------------------------------------------------------
// GET /employees/invites/validate?token=<rawToken>  — public, no auth
// ----------------------------------------------------------------------------

export const validateInviteResponseSchema = z.object({
  email: z.string(),
  store: z.object({
    id: z.string(),
    displayName: z.string(),
    slug: z.string(),
    logoUrl: z.string().nullable(),
  }),
})

// ----------------------------------------------------------------------------
// POST /employees/invites/accept  — auth required
// ----------------------------------------------------------------------------

export const acceptInviteBodySchema = z.object({
  token: z.string().min(1),
  employeeNumber: z.string().max(50).optional(),
})

export const acceptInviteResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  employeeNumber: z.string().nullable(),
  isActive: z.boolean(),
  acceptedAt: z.string(),
  store: z.object({
    id: z.string(),
    displayName: z.string(),
    slug: z.string(),
  }),
})

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type ValidateInviteResponse = z.infer<typeof validateInviteResponseSchema>
export type AcceptInviteBody = z.infer<typeof acceptInviteBodySchema>
export type AcceptInviteResponse = z.infer<typeof acceptInviteResponseSchema>
