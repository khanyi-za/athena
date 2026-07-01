'use client'

import { useState } from 'react'
import { Controller, useWatch, type Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  AutosaveIndicator,
  type AutosaveState,
} from '@/components/ui/autosave-indicator'
import { useAutosaveField } from '@/components/wizard/use-autosave-field'
import { SECTION_LABELS } from '@/components/wizard/required-fields'
import type { Store } from '@/lib/schemas/store'
import type { WizardFormValues } from '@/components/wizard/form-values'

interface ContactSectionProps {
  control: Control<WizardFormValues>
  storeId: string
  initialValues: WizardFormValues
  onSavedRemote?: (store: Store) => void
}

export function ContactSection({
  control,
  storeId,
  initialValues,
  onSavedRemote,
}: ContactSectionProps) {
  const [autosave, setAutosave] = useState<AutosaveState>({ state: 'idle' })

  const contactEmail = useWatch({ control, name: 'contactEmail' })
  const contactPhone = useWatch({ control, name: 'contactPhone' })

  useAutosaveField({ storeId, fieldName: 'contactEmail', value: contactEmail, initialValue: initialValues.contactEmail, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })
  useAutosaveField({ storeId, fieldName: 'contactPhone', value: contactPhone, initialValue: initialValues.contactPhone, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })

  return (
    <section id="section-contact" className="flex flex-col gap-6 scroll-mt-6">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-lg font-semibold text-foreground">{SECTION_LABELS.contact}</h2>
        <AutosaveIndicator autosave={autosave} />
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="contactEmail"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id="contactEmail"
                label="Contact email"
                type="email"
                placeholder="hello@yourbrand.co.za"
                autoComplete="email"
                {...field}
                error={fieldState.error?.message}
              />
              <p className="text-xs text-muted-foreground">
                Where buyers reach you. Distinct from your account email.
              </p>
            </div>
          )}
        />

        <Controller
          control={control}
          name="contactPhone"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id="contactPhone"
                label="Contact phone"
                type="tel"
                placeholder="+27 63 448 9940"
                autoComplete="tel"
                {...field}
                error={fieldState.error?.message}
              />
              <p className="text-xs text-muted-foreground">Used for delivery coordination.</p>
            </div>
          )}
        />
      </div>
    </section>
  )
}
