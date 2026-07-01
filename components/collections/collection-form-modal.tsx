'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MediaUploader } from '@/components/media-uploader'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import { createCollection, updateCollection } from '@/lib/api/collections'
import {
  uploadFileToCloudinary,
  validateFileForUpload,
} from '@/lib/cloudinary-upload'
import { useUpsertCollectionInCache } from '@/hooks/use-collections'
import type { Collection } from '@/lib/schemas/collection'

// Cover image upload limits — mirrors PURPOSE_LIMITS.collection_image in
// components/media-uploader.tsx. Kept in sync manually since the deferred
// path doesn't go through the widget that reads PURPOSE_LIMITS at runtime.
const COVER_LIMITS = {
  maxFileSize: 5 * 1024 * 1024,
  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
}

// Create + edit modal for merchant collections. Per product-frontend-flows.md
// §9.1 + §9.2 — same form for both, with slug-permanence helper text on edit
// since the backend doesn't regenerate slugs on rename.

type Mode = { kind: 'create' } | { kind: 'edit'; target: Collection }

interface CollectionFormModalProps {
  storeId: string
  mode: Mode
  onCancel: () => void
  onSaved: (collection: Collection) => void
}

export function CollectionFormModal({
  storeId,
  mode,
  onCancel,
  onSaved,
}: CollectionFormModalProps) {
  const isEdit = mode.kind === 'edit'
  const target = mode.kind === 'edit' ? mode.target : null

  const [name, setName] = useState(target?.name ?? '')
  const [description, setDescription] = useState(target?.description ?? '')
  const [imageUrl, setImageUrl] = useState(target?.imageUrl ?? '')

  // Deferred-cover state for create mode only. The file is held in memory
  // until submit; on submit we run create → upload(file, newId) → PATCH.
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)

  const [nameError, setNameError] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const upsertCache = useUpsertCollectionInCache()

  // Object URLs allocated for the deferred preview need to be revoked on
  // unmount and when the file is replaced — otherwise we leak.
  const previousPreviewUrlRef = useRef<string | null>(null)
  useEffect(() => {
    previousPreviewUrlRef.current = pendingPreviewUrl
  }, [pendingPreviewUrl])
  useEffect(() => {
    return () => {
      if (previousPreviewUrlRef.current) {
        URL.revokeObjectURL(previousPreviewUrlRef.current)
      }
    }
  }, [])

  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  // Slug preview is a stable derivation from the name input — show the user
  // exactly what URL their collection will live at before they commit.
  const slugPreview = useMemo(
    () => (target?.slug ?? slugifyPreview(name)) || '…',
    [target?.slug, name],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError(null)
    setBannerError(null)

    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters.')
      return
    }
    if (trimmedName.length > 80) {
      setNameError('Name must be 80 characters or fewer.')
      return
    }

    const trimmedDescription = description.trim()
    const trimmedImageUrl = imageUrl.trim()

    setLoading(true)
    try {
      if (isEdit) {
        const saved = await updateCollection(storeId, target!.id, {
          name: trimmedName,
          description: trimmedDescription || undefined,
          imageUrl: trimmedImageUrl || undefined,
        })
        upsertCache(storeId, saved)
        onSaved(saved)
      } else {
        // Create flow: collection first, then (if a cover was picked) upload
        // the file using the new collectionId, then PATCH imageUrl.
        let saved = await createCollection(storeId, {
          name: trimmedName,
          description: trimmedDescription || undefined,
        })
        upsertCache(storeId, saved)

        if (pendingCoverFile) {
          try {
            const result = await uploadFileToCloudinary(pendingCoverFile, {
              uploadContext: 'collection_image',
              storeId,
              collectionId: saved.id,
            })
            saved = await updateCollection(storeId, saved.id, {
              imageUrl: result.secureUrl,
            })
            upsertCache(storeId, saved)
          } catch {
            // Collection exists; cover upload failed. Surface a soft message
            // but still call onSaved so the parent list updates with the row.
            // The merchant can add the cover from Edit later.
            setBannerError(
              'Collection created, but the cover image failed to upload. You can add it from Edit.',
            )
            onSaved(saved)
            return
          }
        }

        onSaved(saved)
      }
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleCoverFilePick(file: File | null) {
    setCoverError(null)
    // Revoke any previous preview URL before replacing it.
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    if (!file) {
      setPendingCoverFile(null)
      setPendingPreviewUrl(null)
      return
    }
    const validationError = validateFileForUpload(file, COVER_LIMITS)
    if (validationError) {
      setCoverError(validationError)
      setPendingCoverFile(null)
      setPendingPreviewUrl(null)
      return
    }
    setPendingCoverFile(file)
    setPendingPreviewUrl(URL.createObjectURL(file))
  }

  function handleError(err: unknown) {
    const e = err as { status?: number; data?: { message?: string | string[] } }
    const message =
      typeof e.data?.message === 'string'
        ? e.data.message
        : Array.isArray(e.data?.message)
          ? e.data.message.join(' · ')
          : ''

    if (e.status === 409) {
      setBannerError(
        message || 'A collection with that name already exists in your store.',
      )
      return
    }
    if (e.status === 400 && /name/i.test(message)) {
      setNameError(message)
      return
    }
    if (e.status === 400 && message) {
      setBannerError(message)
      return
    }
    setBannerError('Something went wrong. Please try again.')
  }

  const title = isEdit ? `Edit "${target!.name}"` : 'Create a new collection'
  const submitLabel = isEdit ? 'Save changes' : 'Create collection'

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="collection-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-y-auto rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        <h2
          id="collection-modal-title"
          className="text-lg font-semibold text-foreground"
        >
          {title}
        </h2>

        {bannerError && (
          <div className="mt-4">
            <Alert variant="error">{bannerError}</Alert>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              id="collection-name"
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              error={nameError ?? undefined}
              placeholder='e.g. "Summer 2026"'
              maxLength={80}
              required
              autoFocus={!isEdit}
            />
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? `URL slug is permanent: collections/`
                : `URL will be collections/`}
              <span className="font-mono text-foreground">{slugPreview}</span>
              {!isEdit && '. Choose the name carefully — it won’t change later.'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="collection-description"
              className="text-sm font-medium text-foreground"
            >
              Description{' '}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="collection-description"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Hot picks for the season"
              className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          {isEdit ? (
            <CollectionImageField
              storeId={storeId}
              collectionId={target!.id}
              value={imageUrl}
              onChange={setImageUrl}
              disabled={loading}
            />
          ) : (
            <DeferredCoverField
              pendingFile={pendingCoverFile}
              previewUrl={pendingPreviewUrl}
              error={coverError}
              disabled={loading}
              onPick={handleCoverFilePick}
            />
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            fullWidth={false}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Image field — upload via Cloudinary or clear
// ----------------------------------------------------------------------------

function CollectionImageField({
  storeId,
  collectionId,
  value,
  onChange,
  disabled,
}: {
  storeId: string
  // Required — the `collection_image` upload context's folder template is
  // stores/{storeId}/collections/{collectionId}, so the signing endpoint
  // 400s when collectionId is missing. Editor-only field as a result.
  collectionId: string
  value: string
  onChange: (next: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        Cover image{' '}
        <span className="text-muted-foreground">(optional)</span>
      </label>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Collection cover" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">No cover</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <MediaUploader
            purpose="collection_image"
            storeId={storeId}
            collectionId={collectionId}
            label={value ? 'Replace cover' : 'Upload cover'}
            onUploaded={(secureUrl) => onChange(secureUrl)}
            disabled={disabled}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-danger disabled:opacity-50"
            >
              Remove cover
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            Square image works best. Up to 5 MB. JPG, PNG, or WebP.
          </p>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Deferred cover field — used only in create mode.
//
// The collection_image upload context requires a collectionId in the signing
// folder. Since the collection doesn't exist yet during create, we hold the
// File in component state and let the parent submit handler upload after the
// collection is created. The file picker shows a local preview via
// URL.createObjectURL so the merchant sees what they picked without a
// network round-trip.
// ----------------------------------------------------------------------------

function DeferredCoverField({
  pendingFile,
  previewUrl,
  error,
  disabled,
  onPick,
}: {
  pendingFile: File | null
  previewUrl: string | null
  error: string | null
  disabled: boolean
  onPick: (file: File | null) => void
}) {
  const inputId = 'collection-cover-file'
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        Cover image{' '}
        <span className="text-muted-foreground">(optional)</span>
      </label>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Cover preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-muted-foreground">No cover</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                onPick(file)
                // Allow re-picking the same filename later.
                e.target.value = ''
              }}
              className="hidden"
            />
            <label
              htmlFor={inputId}
              className={[
                'inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors',
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-brand/90',
              ].join(' ')}
            >
              {pendingFile ? 'Replace cover' : 'Choose cover'}
            </label>
          </div>
          {pendingFile && (
            <button
              type="button"
              onClick={() => onPick(null)}
              disabled={disabled}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-danger disabled:opacity-50"
            >
              Remove cover
            </button>
          )}
          {error ? (
            <p className="text-xs text-danger">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Uploaded when you create the collection. Square image works best. Up
              to 5 MB. JPG, PNG, or WebP.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Frontend-only slug preview. The backend is the source of truth — this is
// just a visual hint while the user types.
function slugifyPreview(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
