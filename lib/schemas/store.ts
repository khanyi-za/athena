import { z } from 'zod'
import { storeStatusSchema } from '@/lib/schemas/auth'

// Source of truth for store-module types — mirrors
// docs/Api-frontend-contracts/store-module-api.md.

// ----------------------------------------------------------------------------
// Banner media — multi-item store banner (≤5 items, image+video mix)
// ----------------------------------------------------------------------------
// Replaces the legacy bannerUrl single-string field per M9. See
// store-module-api.md §"Banner Media Object" and §"Banner Media".

export const bannerMediaTypeSchema = z.enum(['IMAGE', 'VIDEO'])

export const bannerMediaSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  url: z.string(),
  mediaType: bannerMediaTypeSchema,
  sortOrder: z.number().int(),
  isPrimary: z.boolean(),
  createdAt: z.string(),
})

// ----------------------------------------------------------------------------
// Core resources
// ----------------------------------------------------------------------------

// Store object — returned by create, update, submit, request-go-live, and
// embedded in /stores/me. All scalar fields from the contract's "Shared
// Response Shapes" §Store Object.
export const storeSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  companyName: z.string(),
  displayName: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  story: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  // Multi-media banner — see bannerMediaSchema above. Ordered by sortOrder asc.
  // Empty array for freshly created stores. Replaces the legacy bannerUrl.
  bannerMedia: z.array(bannerMediaSchema),
  status: storeStatusSchema,
  rejectionReason: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  businessRegNo: z.string().nullable(),
  vatNumber: z.string().nullable(),
  bankName: z.string().nullable(),
  bankAccountNo: z.string().nullable(),
  bankBranchCode: z.string().nullable(),
  bankAccountType: z.string().nullable(),
  // Decimal-backed columns serialize as JSON strings from Prisma/Postgres
  // (e.g. `"0"` rather than `0`). z.coerce.number() accepts both, so the
  // schema stays correct whether the backend sends a string or a number.
  totalSales: z.coerce.number(),
  totalRevenue: z.coerce.number(),
  averageRating: z.coerce.number(),
  followerCount: z.coerce.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const storeAddressSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  streetNumber: z.string(),
  streetName: z.string(),
  buildingName: z.string().nullable(),
  suburb: z.string().nullable(),
  city: z.string(),
  postalCode: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Employee.user shape returned specifically in /stores/me's employees array.
// Different from the shape in /stores/:storeId/employees (which excludes email).
const employeeUserInStoreMeSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  })
  .nullable()

export const employeeInStoreMeSchema = z.object({
  id: z.string(),
  email: z.string(),
  employeeNumber: z.string().nullable(),
  isActive: z.boolean(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
  user: employeeUserInStoreMeSchema,
})

// ----------------------------------------------------------------------------
// GET /stores/me — full private store view (or `null` body when user has no store)
// ----------------------------------------------------------------------------
// Note: `_count.products` reflects ALL products regardless of status. Active-only
// count requires a separate call to GET /stores/:storeId/products?status=ACTIVE.

export const storeMeSchema = storeSchema.extend({
  addresses: z.array(storeAddressSchema),
  employees: z.array(employeeInStoreMeSchema),
  _count: z.object({
    products: z.number().int(),
    orders: z.number().int(),
    followers: z.number().int(),
  }),
})

// ----------------------------------------------------------------------------
// Request DTOs
// ----------------------------------------------------------------------------

// POST /stores — companyName + displayName required, the rest optional.
// The optional fields can also be set later via PATCH /stores/:id so we don't
// strictly need to surface them in the onboarding form.
export const createStoreBodySchema = z.object({
  companyName: z.string().min(2).max(150),
  displayName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  story: z.string().max(2000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  websiteUrl: z.string().url().optional(),
})

// PATCH /stores/:id — all fields optional. Per contract, you omit to leave
// unchanged (no null-to-clear semantics are documented).
//
// `slug` is intentionally absent — it's auto-generated from displayName.
//
// `bannerUrl` is intentionally absent — banner is multi-item now and managed
// through the dedicated /banner-media endpoints (see below). Backend rejects
// any `bannerUrl` field here with a 400 via forbidNonWhitelisted.
//
// `logoUrl` accepts any string here at the type level; the backend validates
// the URL begins with https://res.cloudinary.com/<configuredCloudName>/. Don't
// .url() these — the validator is delegated to the backend.
export const updateStoreBodySchema = z.object({
  companyName: z.string().min(2).max(150).optional(),
  displayName: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  story: z.string().max(2000).optional(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  businessRegNo: z.string().optional(),
  vatNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankBranchCode: z.string().optional(),
  bankAccountType: z.string().optional(),
})

// ----------------------------------------------------------------------------
// Banner media DTOs
// ----------------------------------------------------------------------------

// POST /stores/:storeId/banner-media — add a single item. The backend appends
// at the end of the gallery; the response is the created BannerMedia row.
export const addBannerMediaBodySchema = z.object({
  url: z.string(),
  mediaType: bannerMediaTypeSchema,
})

// PATCH /stores/:storeId/banner-media/reorder — bulk reorder. The body must
// contain the *exact set* of current item ids in the desired order. The first
// id becomes the cover (isPrimary: true).
export const reorderBannerMediaBodySchema = z.object({
  ids: z.array(z.string()).min(1),
})

// PATCH /reorder response — returns the whole gallery in its new order.
export const bannerMediaListSchema = z.array(bannerMediaSchema)

// ----------------------------------------------------------------------------
// Address DTOs
// ----------------------------------------------------------------------------

// POST /stores/:storeId/addresses — required: streetNumber, streetName, city,
// postalCode. Optional: buildingName, suburb. Char ranges mirror the contract.
export const createAddressBodySchema = z.object({
  streetNumber: z.string().min(1).max(20),
  streetName: z.string().min(2).max(100),
  buildingName: z.string().max(100).optional(),
  suburb: z.string().max(100).optional(),
  city: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(10),
})

// PATCH /stores/:storeId/addresses/:addressId — all fields optional.
export const updateAddressBodySchema = z.object({
  streetNumber: z.string().min(1).max(20).optional(),
  streetName: z.string().min(2).max(100).optional(),
  buildingName: z.string().max(100).optional(),
  suburb: z.string().max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  postalCode: z.string().min(4).max(10).optional(),
})

// ----------------------------------------------------------------------------
// Admin queue + review DTOs
// ----------------------------------------------------------------------------

// Owner attached to admin queue rows + review-decision responses.
export const adminQueueOwnerSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable().optional(),
  role: z.enum(['BUYER', 'MERCHANT']).optional(),
})

// First-review queue item — store fields + attached owner.
export const adminPendingStoreSchema = storeSchema.extend({
  owner: adminQueueOwnerSchema,
})

// Go-live queue item — additionally carries readiness signals so the admin
// can scan the queue without opening every detail page.
//
// `_count.bannerMedia` is the readiness signal for the banner check; the
// bannerMedia[] array on the inherited Store object is the actual content
// (rendered in the queue-row thumbnail + the review-detail strip).
export const adminPendingGoLiveStoreSchema = storeSchema.extend({
  owner: adminQueueOwnerSchema,
  addresses: z.array(storeAddressSchema),
  _count: z.object({
    products: z.number().int(), // active products only on this endpoint per contract
    bannerMedia: z.number().int(),
  }),
})

export const paginatedAdminPendingStoresSchema = z.object({
  data: z.array(adminPendingStoreSchema),
  meta: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
})

export const paginatedAdminPendingGoLiveStoresSchema = z.object({
  data: z.array(adminPendingGoLiveStoreSchema),
  meta: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
})

// POST /stores/:id/review and /review-go-live — same body shape.
// Reason is required only when decision is REJECT; backend enforces ≥10 chars.
export const adminReviewBodySchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().min(10).max(500).optional(),
  })
  .refine((v) => v.decision === 'APPROVE' || (v.reason && v.reason.length >= 10), {
    message: 'A rejection reason is required and must be at least 10 characters',
    path: ['reason'],
  })

// Response from a review action — store fields + owner.
export const adminReviewResponseSchema = storeSchema.extend({
  owner: adminQueueOwnerSchema,
})

// ----------------------------------------------------------------------------
// Type exports
// ----------------------------------------------------------------------------

export type Store = z.infer<typeof storeSchema>
export type StoreAddress = z.infer<typeof storeAddressSchema>
export type EmployeeInStoreMe = z.infer<typeof employeeInStoreMeSchema>
export type StoreMe = z.infer<typeof storeMeSchema>
export type CreateStoreBody = z.infer<typeof createStoreBodySchema>
export type UpdateStoreBody = z.infer<typeof updateStoreBodySchema>
export type CreateAddressBody = z.infer<typeof createAddressBodySchema>
export type UpdateAddressBody = z.infer<typeof updateAddressBodySchema>
export type BannerMedia = z.infer<typeof bannerMediaSchema>
export type BannerMediaType = z.infer<typeof bannerMediaTypeSchema>
export type AddBannerMediaBody = z.infer<typeof addBannerMediaBodySchema>
export type ReorderBannerMediaBody = z.infer<typeof reorderBannerMediaBodySchema>
export type AdminQueueOwner = z.infer<typeof adminQueueOwnerSchema>
export type AdminPendingStore = z.infer<typeof adminPendingStoreSchema>
export type AdminPendingGoLiveStore = z.infer<typeof adminPendingGoLiveStoreSchema>
export type PaginatedAdminPendingStores = z.infer<typeof paginatedAdminPendingStoresSchema>
export type PaginatedAdminPendingGoLiveStores = z.infer<
  typeof paginatedAdminPendingGoLiveStoresSchema
>
export type AdminReviewBody = z.infer<typeof adminReviewBodySchema>
export type AdminReviewResponse = z.infer<typeof adminReviewResponseSchema>

// Admin queue filters
export interface AdminQueueFilters {
  page?: number
  limit?: number
  sortOrder?: 'asc' | 'desc'
}
