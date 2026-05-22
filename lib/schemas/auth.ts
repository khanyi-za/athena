import { z } from 'zod'

// Source of truth for auth-module types — mirrors docs/Api-frontend-contracts/auth-module-api.md §"Shared Response Shapes".
// Inferred TS types are re-exported from types/auth.ts.

export const storeStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'PENDING_GO_LIVE',
  'ACTIVE',
  'SUSPENDED',
  'CLOSED',
])

export const accountStatusSchema = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
  'PENDING_VERIFICATION',
])

export const roleSchema = z.enum(['BUYER', 'MERCHANT', 'ADMIN'])

export const userStoreSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  slug: z.string(),
  status: storeStatusSchema,
  logoUrl: z.string().nullable(),
  rejectionReason: z.string().nullable(),
})

// Full user — returned by GET /auth/me only.
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: roleSchema,
  avatarUrl: z.string().nullable(),
  phone: z.string().nullable(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  accountStatus: accountStatusSchema,
  createdAt: z.string(),
  store: userStoreSchema.nullable(),
})

// Slim user — returned by login / verify-email / refresh. No store, no accountStatus, no verification flags.
export const slimUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: roleSchema,
  avatarUrl: z.string().nullable(),
})

// Browser-facing auth response from our /api/auth/{login,verify-email,refresh} proxies.
// Refresh token is stripped server-side; the browser only ever sees accessToken + slim user.
export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: slimUserSchema,
})

export const apiErrorBodySchema = z.object({
  statusCode: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string(),
})
