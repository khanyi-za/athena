import { z } from 'zod'

// Platform categories — admins manage them, merchants consume via the tree
// picker in the product editor. Source of truth:
// docs/Api-frontend-contracts/product-module-api.md §"GET /categories".
//
// GET /categories is PUBLIC (no auth) and returns the full tree as nested
// `children[]` arrays. We model the recursion via z.lazy + an explicit
// type annotation so TS narrows it correctly through arbitrary depth.

export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId: string | null
  sortOrder: number
  children: CategoryTreeNode[]
}

export const categoryTreeNodeSchema: z.ZodType<CategoryTreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    parentId: z.string().nullable(),
    sortOrder: z.number().int(),
    children: z.array(categoryTreeNodeSchema),
  }),
)

// Top-level response is an array of root categories.
export const categoryTreeResponseSchema = z.array(categoryTreeNodeSchema)

// ----------------------------------------------------------------------------
// Admin category DTOs (POST / PATCH /categories)
// ----------------------------------------------------------------------------

// Create — name + optional fields. Slug auto-generates from name.
export const createCategoryBodySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  imageUrl: z.string().optional(), // backend validates Cloudinary prefix
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

// Update — all optional. parentId can be set to null explicitly to make a
// category a root.
export const updateCategoryBodySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

// Response for create + update — flat shape with parent reference.
export const categoryWithParentSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  parentId: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  parent: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
})

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>
export type CategoryWithParent = z.infer<typeof categoryWithParentSchema>
