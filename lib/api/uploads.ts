import { apiFetch } from '@/lib/api-client'
import {
  cloudinarySignatureRequestSchema,
  cloudinarySignatureResponseSchema,
  type CloudinarySignatureRequest,
  type CloudinarySignatureResponse,
} from '@/lib/schemas/uploads'

// Typed client for the uploads module. Wraps POST /api/uploads/cloudinary-signature
// (which proxies to the backend). The response carries the values the frontend
// passes verbatim to Cloudinary's upload API — signature, timestamp, folder,
// preset, plus the cloud name and API key the widget needs.
//
// Fetch a fresh signature immediately before each upload (signature TTL is 1 hour).
// Do not cache across uploads.

/**
 * Request a signed Cloudinary upload payload for the given context.
 *
 * The backend enforces per-context authz (e.g. canManageStore for store_logo).
 * On 403 the caller should not retry — the user genuinely cannot upload for
 * this resource. On other errors a friendly "Image upload failed — try again"
 * message is appropriate; Cloudinary mechanics should never reach the user.
 */
export async function requestCloudinarySignature(
  body: CloudinarySignatureRequest,
): Promise<CloudinarySignatureResponse> {
  const validated = cloudinarySignatureRequestSchema.parse(body)
  const data = await apiFetch<unknown>('/api/uploads/cloudinary-signature', {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return cloudinarySignatureResponseSchema.parse(data)
}
