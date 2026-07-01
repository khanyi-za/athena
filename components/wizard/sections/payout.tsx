'use client'

import { useState } from 'react'
import { Controller, useWatch, type Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  AutosaveIndicator,
  type AutosaveState,
} from '@/components/ui/autosave-indicator'
import { MaskedBankAccount } from '@/components/ui/masked-bank-account'
import { useAutosaveField } from '@/components/wizard/use-autosave-field'
import { SECTION_LABELS } from '@/components/wizard/required-fields'
import type { Store } from '@/lib/schemas/store'
import type { WizardFormValues } from '@/components/wizard/form-values'

interface PayoutSectionProps {
  control: Control<WizardFormValues>
  storeId: string
  initialValues: WizardFormValues
  onSavedRemote?: (store: Store) => void
}

export function PayoutSection({
  control,
  storeId,
  initialValues,
  onSavedRemote,
}: PayoutSectionProps) {
  const [autosave, setAutosave] = useState<AutosaveState>({ state: 'idle' })

  const bankName = useWatch({ control, name: 'bankName' })
  const bankAccountNo = useWatch({ control, name: 'bankAccountNo' })
  const bankBranchCode = useWatch({ control, name: 'bankBranchCode' })
  const bankAccountType = useWatch({ control, name: 'bankAccountType' })

  useAutosaveField({ storeId, fieldName: 'bankName', value: bankName, initialValue: initialValues.bankName, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })
  // Bank account number is set via the masked field's commit (Edit → blur) —
  // changes arrive in big steps, not per-keystroke, so a 0ms debounce is right.
  useAutosaveField({ storeId, fieldName: 'bankAccountNo', value: bankAccountNo, initialValue: initialValues.bankAccountNo, debounceMs: 0, setState: setAutosave, onSaved: onSavedRemote })
  useAutosaveField({ storeId, fieldName: 'bankBranchCode', value: bankBranchCode, initialValue: initialValues.bankBranchCode, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })
  useAutosaveField({ storeId, fieldName: 'bankAccountType', value: bankAccountType, initialValue: initialValues.bankAccountType, debounceMs: 400, setState: setAutosave, onSaved: onSavedRemote })

  return (
    <section id="section-payout" className="flex flex-col gap-6 scroll-mt-6">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-lg font-semibold text-foreground">{SECTION_LABELS.payout}</h2>
        <AutosaveIndicator autosave={autosave} />
      </header>

      <p className="text-sm text-muted-foreground">
        We use these details to pay out your earnings. Make sure they&apos;re accurate.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="bankName"
          render={({ field, fieldState }) => (
            <Input
              id="bankName"
              label="Bank name"
              placeholder="e.g. FNB, Standard Bank, Capitec"
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="bankBranchCode"
          render={({ field, fieldState }) => (
            <Input
              id="bankBranchCode"
              label="Branch code"
              placeholder="e.g. 250655"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              {...field}
              // Branch codes are digits only. Strip anything else so paste/
              // letters can't sneak in.
              onChange={(e) =>
                field.onChange(e.target.value.replace(/\D/g, ''))
              }
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="bankAccountNo"
          render={({ field, fieldState }) => (
            <MaskedBankAccount
              id="bankAccountNo"
              label="Account number"
              value={field.value}
              onCommit={(next) => field.onChange(next)}
              helperText="Masked after entry. Click Show to verify."
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="bankAccountType"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bankAccountType" className="text-sm font-medium text-foreground">
                Account type
              </label>
              <select
                id="bankAccountType"
                {...field}
                className={[
                  'w-full rounded-lg border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors',
                  fieldState.error
                    ? 'border-danger/30 ring-1 ring-danger/30 focus:border-danger focus:ring-danger'
                    : 'border-border focus:border-ring focus:ring-1 focus:ring-ring',
                ].join(' ')}
              >
                <option value="">Select…</option>
                <option value="Cheque">Cheque</option>
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </select>
              {fieldState.error && (
                <p className="text-xs text-danger">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>
    </section>
  )
}
