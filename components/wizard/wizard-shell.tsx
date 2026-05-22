'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch, type UseFormReturn, type FieldPath } from 'react-hook-form'

import { Alert } from '@/components/ui/alert'
import { RejectionBanner } from '@/components/rejection-banner'
import { useStoreMe, useInvalidateStoreMe } from '@/hooks/use-store-me'
import { useAuthStore } from '@/store/auth-store'
import { fetchAuthMe } from '@/lib/fetch-auth-me'
import { submitStore } from '@/lib/api/store'
import type { StoreMe } from '@/lib/schemas/store'
import {
  ALL_REQUIRED_FIELDS,
  SECTION_LABELS,
  SECTION_ORDER,
  getSectionCompletion,
  getTotalCompletion,
  isAllComplete,
  type RequiredFieldName,
} from '@/components/wizard/required-fields'
import { storeToFormValues, type WizardFormValues } from '@/components/wizard/form-values'
import { BrandIdentitySection } from '@/components/wizard/sections/brand-identity'
import { ContactSection } from '@/components/wizard/sections/contact'
import { BusinessRegistrationSection } from '@/components/wizard/sections/business-registration'
import { PayoutSection } from '@/components/wizard/sections/payout'
import { SubmitModal } from '@/components/wizard/submit-modal'

// The DRAFT setup wizard. Section-based form with autosave per field, completion
// tracking against the 11 required fields, and a submit flow that handles the
// backend's missing-fields error by surfacing inline field errors + a top banner.

export function WizardShell() {
  const { data: store, isLoading, isError } = useStoreMe()

  if (isLoading) return <LoadingState />
  if (isError || !store) return <ErrorState />

  return <WizardForm store={store} />
}

function WizardForm({ store }: { store: StoreMe }) {
  const invalidateStoreMe = useInvalidateStoreMe()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)

  const form = useForm<WizardFormValues>({
    defaultValues: storeToFormValues(store),
    mode: 'onBlur',
  })

  const values = useWatch({ control: form.control }) as Partial<WizardFormValues>
  const total = getTotalCompletion(values as Partial<Record<RequiredFieldName, string>>)
  const allComplete = isAllComplete(values as Partial<Record<RequiredFieldName, string>>)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [missingBanner, setMissingBanner] = useState<string[] | null>(null)

  // Auto-clear manual missing-fields errors as the user fills in fields.
  useAutoClearManualErrors(form)

  function handleSavedRemote() {
    invalidateStoreMe()
  }

  function openSubmitModal() {
    setSubmitError(null)
    setIsModalOpen(true)
  }

  function closeSubmitModal() {
    if (isSubmitting) return
    setIsModalOpen(false)
    setSubmitError(null)
  }

  async function refreshAuthMe() {
    if (!accessToken) return
    const fullUser = await fetchAuthMe(accessToken)
    if (fullUser) setAuth(accessToken, fullUser)
    queryClient.invalidateQueries({ queryKey: ['auth-me'] })
  }

  async function handleConfirmSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await submitStore(store.id)
      // Success — store flipped from DRAFT to PENDING_REVIEW. Refreshing
      // /auth/me re-evaluates the matrix; the dashboard page swaps the wizard
      // out for the UnderReviewFirstScreen automatically.
      invalidateStoreMe()
      await refreshAuthMe()
      // Don't manually close the modal — the wizard unmounts on the matrix swap.
    } catch (err) {
      handleSubmitError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSubmitError(err: unknown) {
    const error = err as { status?: number; data?: { message?: string | string[] } }
    const status = error.status
    const messageRaw = error.data?.message
    const message = typeof messageRaw === 'string' ? messageRaw : ''

    // 400 missing fields — the most important branch. Parse the list, mark
    // each field invalid in RHF, scroll to first, banner up top, modal closed.
    if (status === 400 && /following fields are required/i.test(message)) {
      const fields = parseMissingFields(message)
      const validFields = fields.filter((f) =>
        ALL_REQUIRED_FIELDS.includes(f as RequiredFieldName),
      ) as RequiredFieldName[]

      for (const field of validFields) {
        form.setError(field as FieldPath<WizardFormValues>, {
          type: 'manual',
          message: 'Required for submission',
        })
      }
      setMissingBanner(validFields)
      setIsModalOpen(false)
      if (validFields.length > 0) {
        scrollToField(validFields[0])
      }
      return
    }

    // 400 "Store has already been submitted" — local state was stale.
    // Refresh and let the matrix route us forward.
    if (status === 400 && /already.*submitted|already.*active/i.test(message)) {
      invalidateStoreMe()
      void refreshAuthMe()
      setIsModalOpen(false)
      return
    }

    // 403 / 404 — lost permissions or store gone. Same recovery.
    if (status === 403 || status === 404) {
      invalidateStoreMe()
      void refreshAuthMe()
      setIsModalOpen(false)
      return
    }

    if (status === 429) {
      setSubmitError('Too many attempts. Please wait a moment and try again.')
      return
    }

    setSubmitError('Something went wrong. Please try again.')
  }

  return (
    <div className="flex flex-col gap-6">
      <RejectionBanner storeStatus={store.status} rejectionReason={store.rejectionReason} />

      {missingBanner && missingBanner.length > 0 && (
        <Alert variant="error">
          {missingBanner.length} required{' '}
          {missingBanner.length === 1 ? 'field needs' : 'fields need'} attention before we can
          submit. We&apos;ve highlighted{' '}
          {missingBanner.length === 1 ? 'it' : 'them'} below.
        </Alert>
      )}

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-950">
          {store.displayName || 'Your store'}
        </h1>
        <p className="text-sm text-zinc-500">
          Finish setting up your store and submit it for review when you&apos;re ready.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SectionNav
            values={values as Partial<Record<RequiredFieldName, string>>}
            total={total}
          />
          <div className="mt-4">
            <SubmitButton
              disabled={!allComplete}
              missingCount={total.total - total.completed}
              onClick={openSubmitModal}
            />
          </div>
        </aside>

        <main className="flex flex-col gap-12">
          <BrandIdentitySection
            control={form.control}
            storeId={store.id}
            initialValues={storeToFormValues(store)}
            onSavedRemote={handleSavedRemote}
          />
          <ContactSection
            control={form.control}
            storeId={store.id}
            initialValues={storeToFormValues(store)}
            onSavedRemote={handleSavedRemote}
          />
          <BusinessRegistrationSection
            control={form.control}
            storeId={store.id}
            initialValues={storeToFormValues(store)}
            onSavedRemote={handleSavedRemote}
          />
          <PayoutSection
            control={form.control}
            storeId={store.id}
            initialValues={storeToFormValues(store)}
            onSavedRemote={handleSavedRemote}
          />
        </main>
      </div>

      <SubmitModal
        open={isModalOpen}
        onCancel={closeSubmitModal}
        onConfirm={handleConfirmSubmit}
        loading={isSubmitting}
        error={submitError}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Manual-error auto-clear
// ----------------------------------------------------------------------------
// When the backend reports missing fields we set RHF errors of type 'manual'.
// These don't auto-clear via re-validation, so we subscribe to value changes
// and clear the error as soon as the field has non-empty content.

function useAutoClearManualErrors(form: UseFormReturn<WizardFormValues>) {
  useEffect(() => {
    const subscription = form.watch((_values, { name }) => {
      if (!name) return
      const fieldName = name as FieldPath<WizardFormValues>
      const error = form.formState.errors[fieldName]
      if (error?.type !== 'manual') return
      const current = form.getValues(fieldName)
      if (typeof current === 'string' && current.trim().length > 0) {
        form.clearErrors(fieldName)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])
}

// ----------------------------------------------------------------------------
// Missing-fields parser
// ----------------------------------------------------------------------------
// Backend returns a string like:
//   "The following fields are required before submission: description, logoUrl, bankName"
// We pull out the comma-separated list. (Backend follow-up: return a structured
// { missing: string[] } shape — flagged in project_merchant_ui memory.)

function parseMissingFields(message: string): string[] {
  const match = message.match(/required before submission:\s*(.+)$/i)
  if (!match) return []
  return match[1]
    .split(/,\s*/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
}

function scrollToField(fieldName: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(fieldName)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // Focus once the scroll has had a moment to settle.
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    setTimeout(() => el.focus(), 300)
  }
}

// ----------------------------------------------------------------------------
// Side nav
// ----------------------------------------------------------------------------

function SectionNav({
  values,
  total,
}: {
  values: Partial<Record<RequiredFieldName, string>>
  total: { completed: number; total: number }
}) {
  return (
    <nav className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sections</p>
      <ul className="flex flex-col gap-1">
        {SECTION_ORDER.map((id) => {
          const c = getSectionCompletion(id, values)
          const isComplete = c.completed === c.total
          return (
            <li key={id}>
              <a
                href={`#section-${id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                <span>{SECTION_LABELS[id]}</span>
                <span
                  className={`text-xs font-medium ${isComplete ? 'text-emerald-700' : 'text-zinc-500'}`}
                >
                  {c.completed}/{c.total}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-zinc-100 pt-3 text-xs text-zinc-500">
        {total.completed} of {total.total} required fields complete
      </div>
    </nav>
  )
}

// ----------------------------------------------------------------------------
// Submit button
// ----------------------------------------------------------------------------

function SubmitButton({
  disabled,
  missingCount,
  onClick,
}: {
  disabled: boolean
  missingCount: number
  onClick: () => void
}) {
  const tooltip = disabled
    ? `${missingCount} required ${missingCount === 1 ? 'field' : 'fields'} remaining`
    : 'Ready to submit'

  return (
    <button
      type="button"
      disabled={disabled}
      title={tooltip}
      onClick={onClick}
      className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Submit for review
    </button>
  )
}

// ----------------------------------------------------------------------------
// Loading / error states
// ----------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}

function ErrorState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">Couldn&apos;t load your store</h2>
      <p className="text-sm text-zinc-500">
        Something went wrong on our side. Refresh the page to try again.
      </p>
    </div>
  )
}
