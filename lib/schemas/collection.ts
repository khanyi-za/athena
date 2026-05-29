import { z } from 'zod'

// Store-scoped collections — merchant-curated product groupings (e.g.
// "Summer 2026", "Limited Edition"). Per-store, flat (no hierarchy), and
// distinct from platform categories (which are admin-managed taxonomy).
//
// Mirrors product-frontend-flows.md §9 and product-module-api.md §"Collections".
// The merchant manages these from /dashboard/collections + inline from the
// product editor's Collections section.

// ----------------------------------------------------------------------------
// Collection object — returned by create, update, public list (ACTIVE stores)
// ----------------------------------------------------------------------------

export const collectionSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Optional _count — backend may include or omit depending on endpoint;
  // default to 0 when absent so the UI's product-count badge stays safe.
  _count: z
    .object({
      products: z.number().int(),
    })
    .optional(),
})

// ----------------------------------------------------------------------------
// Request DTOs
// ----------------------------------------------------------------------------

// POST /stores/:storeId/collections
export const createCollectionBodySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  // Cloudinary secure_url; backend validates the URL prefix (same rule as
  // logoUrl). Optional per spec §9.1.
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

// PATCH /stores/:storeId/collections/:collectionId
//
// All fields optional. `slug` is intentionally absent — the backend fixes it
// at creation and never regenerates (per spec §9.1). Editing only the name
// changes the display label; the URL stays.
export const updateCollectionBodySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type Collection = z.infer<typeof collectionSchema>
export type CreateCollectionBody = z.infer<typeof createCollectionBodySchema>
export type UpdateCollectionBody = z.infer<typeof updateCollectionBodySchema>
