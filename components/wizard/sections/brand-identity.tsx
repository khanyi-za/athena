'use client'

import { useState } from 'react'
import { Controller, useWatch, type Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  AutosaveIndicator,
  type AutosaveState,
} from '@/components/ui/autosave-indicator'
import { MediaUploader } from '@/components/media-uploader'
import { useAutosaveField } from '@/components/wizard/use-autosave-field'
import { SECTION_LABELS } from '@/components/wizard/required-fields'
import type { Store } from '@/lib/schemas/store'
import type { WizardFormValues } from '@/components/wizard/form-values'

interface BrandIdentitySectionProps {
  control: Control<WizardFormValues>
  storeId: string
  initialValues: WizardFormValues
  onSavedRemote?: (store: Store) => void
}

export function BrandIdentitySection({
  control,
  storeId,
  initialValues,
  onSavedRemote,
}: BrandIdentitySectionProps) {
  const [autosave, setAutosave] = useState<AutosaveState>({ state: 'idle' })

  const companyName = useWatch({ control, name: 'companyName' })
  const displayName = useWatch({ control, name: 'displayName' })
  const description = useWatch({ control, name: 'description' })
  const story = useWatch({ control, name: 'story' })
  const websiteUrl = useWatch({ control, name: 'websiteUrl' })
  const logoUrl = useWatch({ control, name: 'logoUrl' })

  // Short fields: 400ms debounce (approximates the spec's "on blur" intent).
  useAutosaveField({ storeId, fieldName: 'companyName', value: companyName, initialValue: initialValues.companyName, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })
  useAutosaveField({ storeId, fieldName: 'displayName', value: displayName, initialValue: initialValues.displayName, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })
  useAutosaveField({ storeId, fieldName: 'websiteUrl', value: websiteUrl, initialValue: initialValues.websiteUrl, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })
  // Logo URL flips in one go after Cloudinary upload — save immediately.
  useAutosaveField({ storeId, fieldName: 'logoUrl', value: logoUrl, initialValue: initialValues.logoUrl, debounceMs: 0, setState: setAutosave, onSaved: onSavedRemote })
  // Long textareas: 800ms debounce per store-frontend-flows §2.2.
  useAutosaveField({ storeId, fieldName: 'description', value: description, initialValue: initialValues.description, debounceMs: 800, setState: setAutosave, onSaved: onSavedRemote })
  useAutosaveField({ storeId, fieldName: 'story', value: story, initialValue: initialValues.story, debounceMs: 800, setState: setAutosave, onSaved: onSavedRemote })

  return (
    <section id="section-brandIdentity" className="flex flex-col gap-6 scroll-mt-6">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-lg font-semibold text-zinc-950">{SECTION_LABELS.brandIdentity}</h2>
        <AutosaveIndicator autosave={autosave} />
      </header>

      <div id="logoUrl">
        <Controller
          control={control}
          name="logoUrl"
          render={({ field }) => (
            <LogoField
              storeId={storeId}
              value={field.value}
              onUploaded={(url) => field.onChange(url)}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="companyName"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id="companyName"
                label="Registered company name"
                placeholder="e.g. Khanyi Creative Ventures (Pty) Ltd"
                autoComplete="organization"
                {...field}
                error={fieldState.error?.message}
              />
              <p className="text-xs text-zinc-500">From your CIPC registration.</p>
            </div>
          )}
        />

        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id="displayName"
                label="Brand name"
                placeholder="e.g. BOLD Streetwear"
                {...field}
                error={fieldState.error?.message}
              />
              <p className="text-xs text-zinc-500">What buyers will see.</p>
            </div>
          )}
        />
      </div>

      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <TextAreaField
            id="description"
            label="Short description"
            helperText="A short summary of what your brand sells. Think Instagram bio."
            maxLength={500}
            rows={3}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="story"
        render={({ field, fieldState }) => (
          <TextAreaField
            id="story"
            label="Brand story"
            helperText="Tell buyers about your journey, what you stand for, what makes your brand special. Optional now, required for go-live."
            maxLength={2000}
            rows={6}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="websiteUrl"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1.5">
            <Input
              id="websiteUrl"
              label="Website (optional)"
              placeholder="https://yourbrand.co.za"
              autoComplete="url"
              {...field}
              error={fieldState.error?.message}
            />
            <p className="text-xs text-zinc-500">
              Many SA brands sell only through YIIVA and Instagram — no website needed.
            </p>
          </div>
        )}
      />
    </section>
  )
}

// ----------------------------------------------------------------------------
// Logo field — preview + upload trigger
// ----------------------------------------------------------------------------

function LogoField({
  storeId,
  value,
  onUploaded,
}: {
  storeId: string
  value: string
  onUploaded: (secureUrl: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-700">Logo</label>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Store logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-zinc-400">No logo yet</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <MediaUploader
            purpose="store_logo"
            storeId={storeId}
            label={value ? 'Replace logo' : 'Upload logo'}
            onUploaded={(secureUrl) => onUploaded(secureUrl)}
          />
          <p className="text-xs text-zinc-500">
            Square image works best. Up to 5 MB. JPG, PNG, or WebP.
          </p>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Textarea field — char-counted, styled to match Input
// ----------------------------------------------------------------------------

function TextAreaField({
  id,
  label,
  helperText,
  maxLength,
  rows,
  value,
  onChange,
  onBlur,
  error,
}: {
  id: string
  label: string
  helperText?: string
  maxLength: number
  rows: number
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur: () => void
  error?: string
}) {
  const count = value?.length ?? 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
        <span className="text-xs text-zinc-400">
          {count} / {maxLength}
        </span>
      </div>
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={[
          'w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400',
          error
            ? 'border-red-400 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950',
        ].join(' ')}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500">{helperText}</p>
      ) : null}
    </div>
  )
}
