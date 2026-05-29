import { z } from 'zod'

// Source of truth for the Cloudinary signing flow — mirrors
// docs/Api-frontend-contracts/uploads-module-api.md.

// ----------------------------------------------------------------------------
// Upload contexts (the 6 surfaces YIIVA supports)
// ----------------------------------------------------------------------------

export const uploadContextSchema = z.enum([
  'store_logo',
  'store_banner',
  'store_banner_video',
  'product_image',
  'product_video',
  'collection_image',
  'category_image',
])

// ----------------------------------------------------------------------------
// POST /uploads/cloudinary-signature — request body
// ----------------------------------------------------------------------------
// Required IDs vary by context. Backend rejects missing IDs with 400 validation
// errors. We model all four as optional here and validate at the call site —
// keeps the schema flexible across contexts without exploding into a union.

export const cloudinarySignatureRequestSchema = z.object({
  uploadContext: uploadContextSchema,
  storeId: z.string().optional(),
  productId: z.string().optional(),
  collectionId: z.string().optional(),
  categoryId: z.string().optional(),
})

// ----------------------------------------------------------------------------
// POST /uploads/cloudinary-signature — success response
// ----------------------------------------------------------------------------
// Returned verbatim by the backend; the frontend passes the same values
// (signature, timestamp, folder, preset) to Cloudinary's upload API. Any tampering
// with folder/timestamp/preset invalidates the signature.

export const cloudinarySignatureResponseSchema = z.object({
  signature: z.string(),
  timestamp: z.number().int(),
  apiKey: z.string(),
  cloudName: z.string(),
  preset: z.string(),
  folder: z.string(),
  resourceType: z.enum(['image', 'video']),
})

// ----------------------------------------------------------------------------
// Cloudinary upload-widget result (subset)
// ----------------------------------------------------------------------------
// Shape returned by <CldUploadWidget>'s onSuccess result.info. We only care
// about the fields YIIVA actually consumes — Cloudinary returns many more
// (etag, signature, version, original_filename, etc.) which we ignore.

export const cloudinaryUploadResultSchema = z.object({
  secure_url: z.string().url(),
  public_id: z.string(),
  resource_type: z.enum(['image', 'video']),
  format: z.string(),
  bytes: z.number().int(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
})

// ----------------------------------------------------------------------------
// Type exports
// ----------------------------------------------------------------------------

export type UploadContext = z.infer<typeof uploadContextSchema>
export type CloudinarySignatureRequest = z.infer<typeof cloudinarySignatureRequestSchema>
export type CloudinarySignatureResponse = z.infer<typeof cloudinarySignatureResponseSchema>
export type CloudinaryUploadResult = z.infer<typeof cloudinaryUploadResultSchema>
