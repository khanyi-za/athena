'use client'

import { useState } from 'react'
import { CldImage } from 'next-cloudinary'
import {
  AutosaveIndicator,
  type AutosaveState,
} from '@/components/ui/autosave-indicator'
import { MediaUploader } from '@/components/media-uploader'
import { updateStore } from '@/lib/api/store'
import { STORE_BANNER_RECIPE } from '@/lib/cloudinary-transforms'
import type { Store, StoreMe } from '@/lib/schemas/store'

// Banner upload section for the APPROVED dashboard. Wide hero image shown at
// the top of the merchant's public store profile (1500×500+ recommended).
//
// The autosave indicator only flips to "Saved" after the PATCH lands — not
// after the Cloudinary upload completes — per store-frontend-flows §7.3.

interface BannerSectionProps {
  store: StoreMe
  onSavedRemote?: (store: Store) => void
}

export function BannerSection({ store, onSavedRemote }: BannerSectionProps) {
  const [autosave, setAutosave] = useState<AutosaveState>({ state: 'idle' })
  const [bannerUrl, setBannerUrl] = useState<string>(store.bannerUrl ?? '')

  async function handleUploaded(secureUrl: string) {
    setAutosave({ state: 'saving' })
    try {
      const updated = await updateStore(store.id, { bannerUrl: secureUrl })
      setBannerUrl(secureUrl)
      setAutosave({ state: 'saved', savedAt: Date.now() })
      onSavedRemote?.(updated)
    } catch {
      setAutosave({ state: 'error' })
    }
  }

  return (
    <section
      id="section-banner"
      className="scroll-mt-6 rounded-xl border border-zinc-200 bg-white p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Banner image</h2>
          <p className="mt-1 text-sm text-zinc-500">
            The wide hero shown at the top of your store profile.
          </p>
        </div>
        <AutosaveIndicator autosave={autosave} />
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <div className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 aspect-[4/1]">
          {bannerUrl ? (
            <CldImage
              src={bannerUrl}
              {...STORE_BANNER_RECIPE}
              alt={`${store.displayName} banner`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No banner yet
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <MediaUploader
            purpose="store_banner"
            storeId={store.id}
            label={bannerUrl ? 'Replace banner' : 'Upload banner'}
            onUploaded={(secureUrl) => void handleUploaded(secureUrl)}
            onError={() => setAutosave({ state: 'error' })}
          />
          <p className="text-xs text-zinc-500">
            Wide format works best (at least 1500×500). Up to 10 MB. JPG, PNG, or WebP.
          </p>
        </div>
      </div>
    </section>
  )
}
