import { z } from 'zod'

// Source of truth for product-module types — mirrors
// docs/Api-frontend-contracts/product-module-api.md.

export const productStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'OUT_OF_STOCK',
  'ARCHIVED',
])

// ----------------------------------------------------------------------------
// Sub-resources
// ----------------------------------------------------------------------------

export const productImageSchema = z.object({
  id: z.string(),
  productId: z.string(),
  url: z.string(),
  altText: z.string().nullable(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  sortOrder: z.number().int(),
  isPrimary: z.boolean(),
  createdAt: z.string(),
})

// Variants are out of scope for M5 (deferred to M6), but we type them so the
// full product response still validates cleanly when a product has them.
export const productVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  priceInCents: z.number().int().nullable(),
  stock: z.number().int(),
  reservedStock: z.number().int(),
  color: z.string().nullable(),
  size: z.string().nullable(),
  material: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Embedded shapes returned in the full product detail. The backend includes
// `{ category: { id, name, slug } }` (etc.) rather than the bare category.
export const productCategoryEmbeddedSchema = z.object({
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
})

export const productTagEmbeddedSchema = z.object({
  tag: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
})

export const productCollectionEmbeddedSchema = z.object({
  collection: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
})

// ----------------------------------------------------------------------------
// Full Product — returned by GET /stores/:storeId/products/:id
// ----------------------------------------------------------------------------
// Many fields are read-only from the merchant frontend perspective (cost,
// dimensions, SEO, metrics, reservedStock). They're returned but cannot be
// set via PATCH /stores/:storeId/products/:id.

export const productSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  status: productStatusSchema,
  priceInCents: z.number().int(),
  comparePriceInCents: z.number().int().nullable(),
  costInCents: z.number().int().nullable(),
  sku: z.string().nullable(),
  totalStock: z.number().int(),
  reservedStock: z.number().int(),
  lowStockThreshold: z.number().int(),
  weightInGrams: z.number().int().nullable(),
  lengthCm: z.number().nullable(),
  widthCm: z.number().nullable(),
  heightCm: z.number().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  totalSold: z.number().int(),
  viewCount: z.number().int(),
  averageRating: z.number(),
  reviewCount: z.number().int(),
  isFeatured: z.boolean(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  images: z.array(productImageSchema),
  variants: z.array(productVariantSchema),
  categories: z.array(productCategoryEmbeddedSchema),
  tags: z.array(productTagEmbeddedSchema),
  collections: z.array(productCollectionEmbeddedSchema),
})

// ----------------------------------------------------------------------------
// Product List Item — returned by GET /stores/:storeId/products
// ----------------------------------------------------------------------------

export const productListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  status: productStatusSchema,
  priceInCents: z.number().int(),
  comparePriceInCents: z.number().int().nullable(),
  totalStock: z.number().int(),
  createdAt: z.string(),
  _count: z.object({
    images: z.number().int(),
    variants: z.number().int(),
    categories: z.number().int(),
  }),
  // Primary image only (max 1); empty array if the product has no images yet.
  images: z.array(
    z.object({
      url: z.string(),
      altText: z.string().nullable(),
    }),
  ),
})

export const paginatedProductsResponseSchema = z.object({
  data: z.array(productListItemSchema),
  meta: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
})

// ----------------------------------------------------------------------------
// Request DTOs
// ----------------------------------------------------------------------------

// POST /stores/:storeId/products — minimal create. Other fields filled in via PATCH.
export const createProductBodySchema = z.object({
  title: z.string().min(2).max(120),
  priceInCents: z.number().int().min(0),
  description: z.string().max(5000).optional(),
  comparePriceInCents: z.number().int().min(0).optional(),
  sku: z.string().max(80).optional(),
  totalStock: z.number().int().min(0).optional(),
})

// PATCH /stores/:storeId/products/:id — scalar-only.
// Sub-resources (images, variants, categories, tags, collections) each have
// their own dedicated endpoints.
export const updateProductBodySchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(5000).optional(),
  priceInCents: z.number().int().min(0).optional(),
  comparePriceInCents: z.number().int().min(0).optional(),
  sku: z.string().max(80).optional(),
  totalStock: z.number().int().min(0).optional(),
})

// POST /stores/:storeId/products/:productId/images — url is the Cloudinary
// secure_url; backend validates the URL prefix.
export const addProductImageBodySchema = z.object({
  url: z.string(),
  altText: z.string().max(200).optional(),
  isPrimary: z.boolean().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
})

// PATCH /stores/:storeId/products/:productId/images/reorder — the array MUST
// contain the exact set of current image IDs in the desired order. Backend
// rejects any miscount or unknown ID.
export const reorderProductImagesBodySchema = z.object({
  imageIds: z.array(z.string()).min(1),
})

// ----------------------------------------------------------------------------
// Product list filters (query string for GET /stores/:storeId/products)
// ----------------------------------------------------------------------------

export const productSortBySchema = z.enum([
  'newest',
  'oldest',
  'nameAsc',
  'nameDesc',
  'priceAsc',
  'priceDesc',
  'stockAsc',
])

// The status filter accepts 'all' in addition to the enum values — matches
// the contract's documented options.
export const productListStatusFilterSchema = z.enum([
  'all',
  'DRAFT',
  'ACTIVE',
  'OUT_OF_STOCK',
  'ARCHIVED',
])

// ----------------------------------------------------------------------------
// Type exports
// ----------------------------------------------------------------------------

export type ProductStatus = z.infer<typeof productStatusSchema>
export type ProductImage = z.infer<typeof productImageSchema>
export type ProductVariant = z.infer<typeof productVariantSchema>
export type Product = z.infer<typeof productSchema>
export type ProductListItem = z.infer<typeof productListItemSchema>
export type PaginatedProductsResponse = z.infer<typeof paginatedProductsResponseSchema>
export type CreateProductBody = z.infer<typeof createProductBodySchema>
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>
export type AddProductImageBody = z.infer<typeof addProductImageBodySchema>
export type ReorderProductImagesBody = z.infer<typeof reorderProductImagesBodySchema>
export type ProductSortBy = z.infer<typeof productSortBySchema>
export type ProductListStatusFilter = z.infer<typeof productListStatusFilterSchema>

export interface ProductListFilters {
  page?: number
  limit?: number
  status?: ProductListStatusFilter
  search?: string
  categoryId?: string
  collectionId?: string
  sortBy?: ProductSortBy
}
