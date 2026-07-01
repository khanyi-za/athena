'use client'

import { useEffect, useState } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { createAddress, updateAddress } from '@/lib/api/addresses'
import type {
  CreateAddressBody,
  StoreAddress,
  UpdateAddressBody,
} from '@/lib/schemas/store'

// Reusable add + edit modal for store addresses. Pass `address: null` to add,
// pass an existing address to edit. The form uses vanilla useState — only 5
// fields with submit-on-click, so RHF would be overkill.

interface AddressFormModalProps {
  open: boolean
  storeId: string
  address: StoreAddress | null
  onClose: () => void
  onSuccess: () => void
}

interface FormState {
  streetNumber: string
  streetName: string
  buildingName: string
  suburb: string
  city: string
  postalCode: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

function addressToFormState(address: StoreAddress | null): FormState {
  return {
    streetNumber: address?.streetNumber ?? '',
    streetName: address?.streetName ?? '',
    buildingName: address?.buildingName ?? '',
    suburb: address?.suburb ?? '',
    city: address?.city ?? '',
    postalCode: address?.postalCode ?? '',
  }
}

export function AddressFormModal({
  open,
  storeId,
  address,
  onClose,
  onSuccess,
}: AddressFormModalProps) {
  const isEdit = !!address
  const [form, setForm] = useState<FormState>(() => addressToFormState(address))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Re-hydrate every time the modal opens (or `address` switches).
  useEffect(() => {
    if (!open) return
    setForm(addressToFormState(address))
    setErrors({})
    setBannerError(null)
    setLoading(false)
  }, [open, address])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onClose])

  useBodyScrollLock(open)

  if (!open) return null

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBannerError(null)
    setErrors({})
    setLoading(true)

    try {
      if (isEdit && address) {
        const body: UpdateAddressBody = {
          streetNumber: form.streetNumber.trim() || undefined,
          streetName: form.streetName.trim() || undefined,
          buildingName: form.buildingName.trim() || undefined,
          suburb: form.suburb.trim() || undefined,
          city: form.city.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
        }
        await updateAddress(storeId, address.id, body)
      } else {
        const body: CreateAddressBody = {
          streetNumber: form.streetNumber.trim(),
          streetName: form.streetName.trim(),
          buildingName: form.buildingName.trim() || undefined,
          suburb: form.suburb.trim() || undefined,
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
        }
        await createAddress(storeId, body)
      }
      onSuccess()
    } catch (err) {
      handleAddressError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleAddressError(err: unknown) {
    const error = err as { status?: number; data?: { message?: string | string[] } }
    const status = error.status
    const messageRaw = error.data?.message
    const message = typeof messageRaw === 'string' ? messageRaw : ''

    if (status === 400 && Array.isArray(messageRaw)) {
      const fieldErrors: FieldErrors = {}
      for (const msg of messageRaw) {
        const match = msg.match(
          /^(streetNumber|streetName|buildingName|suburb|city|postalCode)/i,
        )
        if (match) {
          const field = match[1] as keyof FormState
          fieldErrors[field] = cleanValidationMessage(msg)
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        setBannerError('Please check the fields below and try again.')
      }
      return
    }

    if (status === 400 && /closed store/i.test(message)) {
      setBannerError('Addresses cannot be added to a closed store.')
      return
    }

    if (status === 403) {
      setBannerError("You don't have permission to manage this store's addresses.")
      return
    }

    if (status === 404) {
      setBannerError('This address no longer exists. Close this dialog to refresh the list.')
      return
    }

    setBannerError('Something went wrong. Please try again.')
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="address-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="address-modal-title" className="text-lg font-semibold text-foreground">
          {isEdit ? 'Edit location' : 'Add a location'}
        </h2>

        {bannerError && (
          <div className="mt-4">
            <Alert variant="error">{bannerError}</Alert>
          </div>
        )}

        <form className="mt-6 flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
            <Input
              id="streetNumber"
              label="Street number"
              placeholder="12A"
              value={form.streetNumber}
              onChange={(e) => update('streetNumber', e.target.value)}
              error={errors.streetNumber}
              disabled={loading}
              required
            />
            <Input
              id="streetName"
              label="Street name"
              placeholder="Long Street"
              value={form.streetName}
              onChange={(e) => update('streetName', e.target.value)}
              error={errors.streetName}
              disabled={loading}
              required
            />
          </div>

          <Input
            id="buildingName"
            label="Building or complex (optional)"
            placeholder="The Mews"
            value={form.buildingName}
            onChange={(e) => update('buildingName', e.target.value)}
            error={errors.buildingName}
            disabled={loading}
          />

          <Input
            id="suburb"
            label="Suburb (optional)"
            placeholder="Rosebank"
            value={form.suburb}
            onChange={(e) => update('suburb', e.target.value)}
            error={errors.suburb}
            disabled={loading}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <Input
              id="city"
              label="City"
              placeholder="Johannesburg"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              error={errors.city}
              disabled={loading}
              required
            />
            <Input
              id="postalCode"
              label="Postal code"
              placeholder="2196"
              value={form.postalCode}
              onChange={(e) => update('postalCode', e.target.value)}
              error={errors.postalCode}
              disabled={loading}
              required
            />
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
              {isEdit ? 'Save changes' : 'Add location'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Lightly tidy backend validation messages (e.g. "streetName must be longer
// than or equal to 2 characters") for inline display.
function cleanValidationMessage(raw: string): string {
  const withoutPrefix = raw.replace(/^[a-z][A-Za-z0-9]*\s+/, '').replace(/\.$/, '')
  return withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1) + '.'
}
