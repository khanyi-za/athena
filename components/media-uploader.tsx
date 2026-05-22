'use client'

import { useEffect, useRef, useState } from 'react'
import { CldUploadWidget } from 'next-cloudinary'

import { requestCloudinarySignature } from '@/lib/api/uploads'
import {
  cloudinaryUploadResultSchema,
  type CloudinarySignatureResponse,
  type UploadContext,
} from '@/lib/schemas/uploads'

// Wraps next-cloudinary's <CldUploadWidget> with the Pattern A signing flow:
// fetch a fresh signature from our backend on click, open the widget pre-loaded
// with that signature, and call back with the resulting Cloudinary secure_url.
//
// One <MediaUploader> per upload moment in the app. The caller is responsible
// for the surrounding UX (preview, "Saved" indicator firing after the downstream
// PATCH succeeds, etc.) — see store-frontend-flows §7.3 / product-frontend-flows §11.1.

// ----------------------------------------------------------------------------
// Per-purpose constraints (mirrors backend preset config — defense in depth)
// ----------------------------------------------------------------------------

const PURPOSE_LIMITS: Record<
  UploadContext,
  {
    maxFileSize: number
    clientAllowedFormats: string[]
    sources: Array<'local' | 'camera'>
  }
> = {
  store_logo: {
    maxFileSize: 5 * 1024 * 1024,
    clientAllowedFormats: ['jpg', 'png', 'webp'],
    sources: ['local'],
  },
  store_banner: {
    maxFileSize: 10 * 1024 * 1024,
    clientAllowedFormats: ['jpg', 'png', 'webp'],
    sources: ['local'],
  },
  product_image: {
    maxFileSize: 10 * 1024 * 1024,
    clientAllowedFormats: ['jpg', 'png', 'webp'],
    sources: ['local', 'camera'],
  },
  product_video: {
    maxFileSize: 50 * 1024 * 1024,
    clientAllowedFormats: ['mp4', 'webm'],
    sources: ['local'],
  },
  collection_image: {
    maxFileSize: 5 * 1024 * 1024,
    clientAllowedFormats: ['jpg', 'png', 'webp'],
    sources: ['local'],
  },
  category_image: {
    maxFileSize: 5 * 1024 * 1024,
    clientAllowedFormats: ['jpg', 'png', 'webp'],
    sources: ['local'],
  },
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface MediaUploaderProps {
  purpose: UploadContext
  storeId?: string
  productId?: string
  collectionId?: string
  categoryId?: string
  /** Called with the Cloudinary `secure_url` + `public_id` after a successful upload. */
  onUploaded: (secureUrl: string, publicId: string) => void
  /** Called with a friendly error message on any failure. */
  onError?: (message: string) => void
  label?: string
  disabled?: boolean
  /**
   * Custom trigger renderer — receives state so callers can build a drop-zone,
   * image-preview, or any other UI shape. Defaults to a plain button.
   */
  children?: (state: {
    onClick: () => void
    isPreparing: boolean
    isOpen: boolean
    disabled: boolean
  }) => React.ReactNode
}

type Phase = 'idle' | 'fetching' | 'open'

const GENERIC_ERROR = 'Image upload failed — try again.'

export function MediaUploader({
  purpose,
  storeId,
  productId,
  collectionId,
  categoryId,
  onUploaded,
  onError,
  label = 'Upload',
  disabled,
  children,
}: MediaUploaderProps) {
  const [signature, setSignature] = useState<CloudinarySignatureResponse | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [retryAttempted, setRetryAttempted] = useState(false)

  function reset() {
    setSignature(null)
    setPhase('idle')
    setRetryAttempted(false)
  }

  async function fetchAndOpen() {
    setPhase('fetching')
    try {
      const sig = await requestCloudinarySignature({
        uploadContext: purpose,
        storeId,
        productId,
        collectionId,
        categoryId,
      })
      setSignature(sig)
      setPhase('open')
    } catch {
      reset()
      onError?.(GENERIC_ERROR)
    }
  }

  function handleClick() {
    if (phase !== 'idle' || disabled) return
    void fetchAndOpen()
  }

  const isPreparing = phase === 'fetching'
  const isOpen = phase === 'open'

  return (
    <>
      {children ? (
        children({ onClick: handleClick, isPreparing, isOpen, disabled: !!disabled })
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || phase !== 'idle'}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPreparing ? 'Preparing…' : label}
        </button>
      )}

      {signature && (
        <SignedWidget
          signature={signature}
          purpose={purpose}
          onSuccess={(secureUrl, publicId) => {
            reset()
            onUploaded(secureUrl, publicId)
          }}
          onClose={reset}
          onSignatureFailure={() => {
            // Cloudinary rejected with signature-validity issue — re-fetch once
            // (per uploads-module-api.md §"Signature validity and retry behaviour").
            if (retryAttempted) {
              reset()
              onError?.(GENERIC_ERROR)
              return
            }
            setRetryAttempted(true)
            setSignature(null)
            void fetchAndOpen()
          }}
          onUploadError={() => {
            reset()
            onError?.(GENERIC_ERROR)
          }}
        />
      )}
    </>
  )
}

// ----------------------------------------------------------------------------
// Internal: the actual CldUploadWidget instance
// ----------------------------------------------------------------------------

interface SignedWidgetProps {
  signature: CloudinarySignatureResponse
  purpose: UploadContext
  onSuccess: (secureUrl: string, publicId: string) => void
  onClose: () => void
  onSignatureFailure: () => void
  onUploadError: () => void
}

function SignedWidget({
  signature,
  purpose,
  onSuccess,
  onClose,
  onSignatureFailure,
  onUploadError,
}: SignedWidgetProps) {
  const limits = PURPOSE_LIMITS[purpose]

  return (
    <CldUploadWidget
      uploadPreset={signature.preset}
      options={{
        apiKey: signature.apiKey,
        cloudName: signature.cloudName,
        uploadSignature: signature.signature,
        uploadSignatureTimestamp: signature.timestamp,
        folder: signature.folder,
        resourceType: signature.resourceType,
        sources: limits.sources,
        clientAllowedFormats: limits.clientAllowedFormats,
        maxFileSize: limits.maxFileSize,
        multiple: false,
        singleUploadAutoClose: true,
        showAdvancedOptions: false,
        showPoweredBy: false,
      }}
      onSuccess={(results) => {
        const info = results?.info
        if (!info || typeof info === 'string') {
          onUploadError()
          return
        }
        const parsed = cloudinaryUploadResultSchema.safeParse(info)
        if (parsed.success) {
          onSuccess(parsed.data.secure_url, parsed.data.public_id)
        } else {
          console.error('[MediaUploader] Cloudinary result failed validation', parsed.error)
          onUploadError()
        }
      }}
      onError={(error) => {
        const message = errorMessage(error)
        if (/signature|stale request|expired/i.test(message)) {
          onSignatureFailure()
        } else {
          onUploadError()
        }
      }}
      onClose={onClose}
    >
      {({ open }) => <AutoOpener open={open} />}
    </CldUploadWidget>
  )
}

// Open the widget once on mount — the user's intent to upload has already been
// captured by their click on our outer button. Skipping this would force a
// second click inside the widget which would be jarring.
//
// The ref guards against `open` changing references mid-life (causing the effect
// to re-run) — we only ever want the widget to open once per mount.
function AutoOpener({ open }: { open: () => void }) {
  const openedRef = useRef(false)
  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    open()
  }, [open])
  return null
}

// Cloudinary's onError can pass a string, an object with statusText, or null.
function errorMessage(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>
    if (typeof obj.statusText === 'string') return obj.statusText
    if (typeof obj.message === 'string') return obj.message
  }
  return ''
}
