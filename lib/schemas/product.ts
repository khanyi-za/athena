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

// Variant editing shipped 2026-07 (was deferred to M6). A variant's stock is
// independent of the product's totalStock — a product WITH variants sells from
// variant stock; the bare totalStock is ignored by carts/checkout.
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
  // Decimal-backed columns serialize as JSON strings from Prisma/Postgres
  // (e.g. "0" rather than 0). z.coerce.number() accepts both, so the schema
  // stays correct whether the backend sends a string or a number. Same
  // pattern we applied to the store schema's totalRevenue / averageRating.
  lengthCm: z.coerce.number().nullable(),
  widthCm: z.coerce.number().nullable(),
  heightCm: z.coerce.number().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  totalSold: z.number().int(),
  viewCount: z.number().int(),
  averageRating: z.coerce.number(),
  reviewCount: z.number().int(),
  isFeatured: z.boolean(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Embedded relations default to [] when absent. The backend's POST
  // /products response omits these arrays entirely on a fresh create (since
  // a new product has nothing linked yet); GET /products/:id includes them.
  // Defaulting here keeps the schema usable for both shapes without forcing
  // a backend contract change.
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  categories: z.array(productCategoryEmbeddedSchema).default([]),
  tags: z.array(productTagEmbeddedSchema).default([]),
  collections: z.array(productCollectionEmbeddedSchema).default([]),
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
  lowStockThreshold: z.number().int().min(0).optional(),
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

// POST /stores/:storeId/products/:productId/variants — priceInCents omitted =
// variant inherits the product's base price.
export const createVariantBodySchema = z.object({
  name: z.string().min(2).max(80),
  sku: z.string().max(80).optional(),
  priceInCents: z.number().int().min(0).optional(),
  stock: z.number().int().min(0),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

// PATCH …/variants/:variantId — all optional; priceInCents: null clears the
// override so the variant falls back to the product's base price.
export const updateVariantBodySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  sku: z.string().max(80).optional(),
  priceInCents: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  sortOrder: z.number().int().optional(),
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
export type CreateVariantBody = z.infer<typeof createVariantBodySchema>
export type UpdateVariantBody = z.infer<typeof updateVariantBodySchema>
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
