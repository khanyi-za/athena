'use client'

import { useEffect, useState } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { createProduct } from '@/lib/api/products'
import { formatZAR, parseZAR } from '@/lib/format-money'
import { useInvalidateProducts } from '@/hooks/use-products'

// Minimum-payload create modal per product-frontend-flows §3 — just title +
// price. Other fields filled in via PATCH in the editor.
//
// The parent renders this conditionally (no `open` prop) so React mounts a
// fresh instance per session — useState initial values reset for free.

interface CreateProductModalProps {
  storeId: string
  onClose: () => void
}

interface FieldErrors {
  title?: string
  priceInCents?: string
}

export function CreateProductModal({ storeId, onClose }: CreateProductModalProps) {
  const router = useRouter()
  const invalidateProducts = useInvalidateProducts()

  const [title, setTitle] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Esc closes (unless mid-submit). Body scroll lock while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onClose])

  useBodyScrollLock()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setBannerError(null)

    // Client-side validation
    const trimmedTitle = title.trim()
    const localErrors: FieldErrors = {}
    if (trimmedTitle.length < 2) {
      localErrors.title = 'Title must be at least 2 characters.'
    } else if (trimmedTitle.length > 120) {
      localErrors.title = 'Title must be at most 120 characters.'
    }
    const priceCents = parseZAR(priceInput)
    if (priceCents === null) {
      localErrors.priceInCents = 'Enter a valid price.'
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      return
    }

    setLoading(true)
    try {
      const product = await createProduct(storeId, {
        title: trimmedTitle,
        priceInCents: priceCents as number,
      })
      invalidateProducts(storeId)
      router.push(`/dashboard/products/${product.id}`)
    } catch (err) {
      handleCreateError(err)
      setLoading(false)
    }
  }

  function handleCreateError(err: unknown) {
    const error = err as { status?: number; data?: { message?: string | string[] } }
    const status = error.status
    const messageRaw = error.data?.message

    if (status === 400 && Array.isArray(messageRaw)) {
      const fieldErrors: FieldErrors = {}
      for (const msg of messageRaw) {
        if (/^title/i.test(msg)) fieldErrors.title = cleanValidationMessage(msg)
        else if (/^priceInCents/i.test(msg))
          fieldErrors.priceInCents = cleanValidationMessage(msg)
      }
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        return
      }
      setBannerError('Please check the fields below and try again.')
      return
    }

    if (status === 403) {
      setBannerError("You don't have permission to add products to this store.")
      return
    }

    if (status === 429) {
      setBannerError('Too many attempts. Please wait a moment and try again.')
      return
    }

    setBannerError('Something went wrong. Please try again.')
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="create-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-product-title" className="text-lg font-semibold text-foreground">
          Add a product
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Just a title and a price to start. You can fill in the rest in the editor.
        </p>

        {bannerError && (
          <div className="mt-4">
            <Alert variant="error">{bannerError}</Alert>
          </div>
        )}

        <form className="mt-6 flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
          <Input
            id="title"
            label="Title"
            type="text"
            placeholder="e.g. Vintage Tee"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setErrors((p) => ({ ...p, title: undefined }))
            }}
            error={errors.title}
            disabled={loading}
            required
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="priceInCents" className="text-sm font-medium text-foreground">
              Price (ZAR)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R</span>
              <input
                id="priceInCents"
                type="text"
                inputMode="decimal"
                placeholder="249.00"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value)
                  setErrors((p) => ({ ...p, priceInCents: undefined }))
                }}
                onBlur={() => {
                  const cents = parseZAR(priceInput)
                  if (cents !== null) setPriceInput(formatZAR(cents).replace('R ', ''))
                }}
                disabled={loading}
                className={[
                  'w-full rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground',
                  errors.priceInCents
                    ? 'border-danger/30 ring-1 ring-danger/30 focus:border-danger focus:ring-danger'
                    : 'border-border focus:border-ring focus:ring-1 focus:ring-ring',
                ].join(' ')}
              />
            </div>
            {errors.priceInCents ? (
              <p className="text-xs text-danger">{errors.priceInCents}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                You can change this later. Activation requires a price greater than zero.
              </p>
            )}
          </div>

          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              fullWidth={false}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth={false} loading={loading}>
              Create product
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function cleanValidationMessage(raw: string): string {
  const stripped = raw.replace(/^[a-z][A-Za-z0-9]*\s+/, '').replace(/\.$/, '')
  return stripped.charAt(0).toUpperCase() + stripped.slice(1) + '.'
}
