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

interface BusinessRegistrationSectionProps {
  control: Control<WizardFormValues>
  storeId: string
  initialValues: WizardFormValues
  onSavedRemote?: (store: Store) => void
}

export function BusinessRegistrationSection({
  control,
  storeId,
  initialValues,
  onSavedRemote,
}: BusinessRegistrationSectionProps) {
  const [autosave, setAutosave] = useState<AutosaveState>({ state: 'idle' })

  const businessRegNo = useWatch({ control, name: 'businessRegNo' })
  const vatNumber = useWatch({ control, name: 'vatNumber' })

  useAutosaveField({ storeId, fieldName: 'businessRegNo', value: businessRegNo, initialValue: initialValues.businessRegNo, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })
  useAutosaveField({ storeId, fieldName: 'vatNumber', value: vatNumber, initialValue: initialValues.vatNumber, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })

  return (
    <section id="section-business" className="flex flex-col gap-6 scroll-mt-6">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-lg font-semibold text-zinc-950">{SECTION_LABELS.business}</h2>
        <AutosaveIndicator autosave={autosave} />
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="businessRegNo"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id="businessRegNo"
                label="CIPC registration number"
                placeholder="e.g. 2024/123456/07"
                {...field}
                error={fieldState.error?.message}
              />
              <p className="text-xs text-zinc-500">
                We use this to verify your business is legitimate.
              </p>
            </div>
          )}
        />

        <Controller
          control={control}
          name="vatNumber"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id="vatNumber"
                label="VAT number (optional)"
                placeholder="e.g. 4123456789"
                {...field}
                error={fieldState.error?.message}
              />
              <p className="text-xs text-zinc-500">
                Only required if your business is VAT-registered (R1m+ annual turnover).
              </p>
            </div>
          )}
        />
      </div>
    </section>
  )
}
