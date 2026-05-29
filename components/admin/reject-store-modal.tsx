'use client'

import { useEffect, useState } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// Reject modal per store-frontend-flows §6.4. The highest-leverage admin UX
// feature per the admin journey doc — templates prevent rejection-copy quality
// from degrading through the day.
//
// Same shape used for the go-live reject (via `variant` prop) but with
// different template sets — see store-frontend-flows §6.8.

interface RejectStoreModalProps {
  storeDisplayName: string
  ownerFirstName: string
  onCancel: () => void
  onConfirm: (reason: string) => void
  loading: boolean
  error?: string | null
  variant?: 'first-review' | 'go-live'
}

const FIRST_REVIEW_TEMPLATES = [
  {
    label: 'Logo quality',
    text: 'The logo image quality is too low. Please upload a higher resolution version (at least 500×500 pixels) so it looks sharp on buyer screens.',
  },
  {
    label: 'Banking details',
    text: "Your bank account details couldn't be verified. Please double-check your account number and branch code, then resubmit.",
  },
  {
    label: 'Business registration',
    text: "We couldn't find your CIPC registration number. Please check it for typos and resubmit.",
  },
  {
    label: 'Description too brief',
    text: "Your description is too brief. Tell buyers more about what you sell — a few sentences about your products and what makes your brand special.",
  },
]

const GO_LIVE_TEMPLATES = [
  {
    label: 'Banner quality',
    text: 'Your banner image quality is too low. Please upload a banner with minimum 1500×500 pixels so it looks great on buyer screens.',
  },
  {
    label: 'Product photography',
    text: 'Your product photos vary in quality and style. Please use consistent lighting and a similar background across all product images for a more professional look.',
  },
  {
    label: 'Story too brief',
    text: 'Your brand story is short. Tell buyers more about your journey, what you stand for, and what makes your brand special — at least 200 words.',
  },
  {
    label: 'More products needed',
    text: 'Your store has 7 active products which meets the minimum, but a stronger launch has 12+ products. Consider adding a few more before going live.',
  },
]

const MAX_REASON_LENGTH = 500

export function RejectStoreModal({
  storeDisplayName,
  ownerFirstName,
  onCancel,
  onConfirm,
  loading,
  error,
  variant = 'first-review',
}: RejectStoreModalProps) {
  const [reason, setReason] = useState('')
  const templates = variant === 'go-live' ? GO_LIVE_TEMPLATES : FIRST_REVIEW_TEMPLATES

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  useBodyScrollLock()

  const trimmed = reason.trim()
  const canSubmit = trimmed.length >= 10

  function handleSubmit() {
    if (!canSubmit) return
    onConfirm(trimmed)
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="reject-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative flex w-full max-w-lg flex-col gap-4 rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 id="reject-modal-title" className="text-lg font-semibold text-zinc-950">
            {variant === 'go-live'
              ? `Reject ${storeDisplayName}'s launch?`
              : `Reject ${storeDisplayName}'s application?`}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            {variant === 'go-live'
              ? `${ownerFirstName}'s store will return to APPROVED. They keep their dashboard and MERCHANT role — they just need to address your feedback before requesting launch again.`
              : `${ownerFirstName} will be notified by email and can edit and resubmit. Be specific so they know what to fix.`}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <details className="rounded-lg border border-zinc-200 bg-zinc-50 text-sm">
            <summary className="cursor-pointer px-3 py-2 font-medium text-zinc-700">
              Templates ▾
            </summary>
            <div className="border-t border-zinc-200 p-3">
              <ul className="flex flex-col gap-1">
                {templates.map((tpl) => (
                  <li key={tpl.label}>
                    <button
                      type="button"
                      onClick={() => setReason(tpl.text)}
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 transition-colors hover:bg-white"
                    >
                      <span className="font-medium">{tpl.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reject-reason" className="text-sm font-medium text-zinc-700">
              Reason (visible to the merchant)
            </label>
            <textarea
              id="reject-reason"
              rows={6}
              maxLength={MAX_REASON_LENGTH}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="Be specific — they need to know what to fix."
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
            />
            <div className="flex items-center justify-between text-xs">
              <p
                className={
                  canSubmit
                    ? 'text-zinc-500'
                    : 'text-amber-700'
                }
              >
                {canSubmit
                  ? 'This message goes directly to the merchant.'
                  : `Minimum 10 characters.`}
              </p>
              <span className="text-zinc-400">
                {trimmed.length} / {MAX_REASON_LENGTH}
              </span>
            </div>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            fullWidth={false}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            fullWidth={false}
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}
