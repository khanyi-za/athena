import { requestCloudinarySignature } from '@/lib/api/uploads'
import {
  cloudinaryUploadResultSchema,
  type CloudinarySignatureRequest,
  type CloudinaryUploadResult,
} from '@/lib/schemas/uploads'

// Programmatic Cloudinary upload — bypasses the CldUploadWidget so callers can
// defer the upload until after the parent resource exists. Used by flows like
// "create collection with cover" where the cover needs the collectionId in the
// signing folder (stores/{storeId}/collections/{collectionId}) but the
// collection itself is created in the same submit step.
//
// The standard MediaUploader (widget-based) is still preferred for normal
// upload-then-save flows — it gives the user upload progress, retry, drag
// support, and previews for free. Use this helper only when the resource
// doesn't exist yet at file-pick time.

interface UploadResult {
  secureUrl: string
  publicId: string
  width?: number
  height?: number
  bytes: number
  format: string
}

/**
 * Sign + POST a file directly to Cloudinary's REST upload endpoint.
 *
 * Throws on:
 * - 4xx/5xx from the signing endpoint (caller likely shows a generic error)
 * - 4xx/5xx from Cloudinary (likely signature mismatch / preset constraint)
 * - Response that doesn't match the expected Cloudinary success shape
 */
export async function uploadFileToCloudinary(
  file: File,
  context: CloudinarySignatureRequest,
): Promise<UploadResult> {
  const sig = await requestCloudinarySignature(context)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.apiKey)
  formData.append('timestamp', String(sig.timestamp))
  formData.append('signature', sig.signature)
  formData.append('folder', sig.folder)
  formData.append('upload_preset', sig.preset)
  // Backend's stringToSign always includes source=uw (the widget injects it,
  // and the backend signs it regardless of caller). Send the same value here
  // so the signature verifies; Cloudinary doesn't validate the literal "uw"
  // string, only that what we send matches what the backend signed.
  formData.append('source', 'uw')

  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`

  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
    }
    const message =
      typeof body.error?.message === 'string'
        ? body.error.message
        : `Cloudinary upload failed (${res.status})`
    throw new Error(message)
  }

  const data: unknown = await res.json()
  const parsed = cloudinaryUploadResultSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Unexpected Cloudinary response shape')
  }
  return formatResult(parsed.data)
}

function formatResult(raw: CloudinaryUploadResult): UploadResult {
  return {
    secureUrl: raw.secure_url,
    publicId: raw.public_id,
    width: raw.width,
    height: raw.height,
    bytes: raw.bytes,
    format: raw.format,
  }
}

// ----------------------------------------------------------------------------
// Client-side validation — mirrors PURPOSE_LIMITS in components/media-uploader.tsx
// so callers can pre-flight the file before signing.
// ----------------------------------------------------------------------------

export interface FileValidationLimits {
  maxFileSize: number
  clientAllowedFormats: string[]
}

export function validateFileForUpload(
  file: File,
  limits: FileValidationLimits,
): string | null {
  if (file.size > limits.maxFileSize) {
    const mb = Math.round(limits.maxFileSize / (1024 * 1024))
    return `File is too large. Max size is ${mb} MB.`
  }
  const name = file.name.toLowerCase()
  const ext = name.includes('.') ? name.split('.').pop()! : ''
  if (!limits.clientAllowedFormats.includes(ext)) {
    return `Unsupported format. Allowed: ${limits.clientAllowedFormats.join(', ').toUpperCase()}.`
  }
  return null
}
