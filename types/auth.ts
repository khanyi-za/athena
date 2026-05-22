import type { z } from 'zod'
import type {
  accountStatusSchema,
  apiErrorBodySchema,
  authResponseSchema,
  roleSchema,
  slimUserSchema,
  storeStatusSchema,
  userSchema,
  userStoreSchema,
} from '@/lib/schemas/auth'

// Single source of truth: lib/schemas/auth.ts.
// Types here are inferred from the zod schemas so the runtime guard and the
// TypeScript surface never drift.

export type StoreStatus = z.infer<typeof storeStatusSchema>
export type AccountStatus = z.infer<typeof accountStatusSchema>
export type Role = z.infer<typeof roleSchema>
export type UserStore = z.infer<typeof userStoreSchema>
export type User = z.infer<typeof userSchema>
export type SlimUser = z.infer<typeof slimUserSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
