'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import { WereYouInvitedLink } from '@/components/auth/were-you-invited-link'
import { resolveDashboardView } from '@/lib/routing-matrix'
import { createStore } from '@/lib/api/store'
import { fetchAuthMe } from '@/lib/fetch-auth-me'

type Mode = 'picker' | 'creating'

export default function OnboardingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)
  const isInitializing = useAuthStore((s) => s.isInitializing)

  const view = user ? resolveDashboardView(user) : null

  const [mode, setMode] = useState<Mode>('picker')
  const [showShopExplainer, setShowShopExplainer] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [companyNameError, setCompanyNameError] = useState<string | null>(null)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Only BUYER + no store belongs here. Anyone else routes via the matrix.
  useEffect(() => {
    if (isInitializing || !view) return
    if (view.kind !== 'onboarding-intent') {
      router.replace('/dashboard')
    }
  }, [isInitializing, view, router])

  if (isInitializing || !user || !view || view.kind !== 'onboarding-intent') {
    return (
      <div className="flex items-center justify-center py-10">
        <div
          aria-hidden
          className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-brand"
        />
      </div>
    )
  }

  async function refreshAuthMe() {
    if (!accessToken) return
    const fullUser = await fetchAuthMe(accessToken)
    if (fullUser) setAuth(accessToken, fullUser)
    queryClient.invalidateQueries({ queryKey: ['auth-me'] })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    setCompanyNameError(null)
    setDisplayNameError(null)
    setBannerError(null)
    setLoading(true)

    try {
      await createStore({
        companyName: companyName.trim(),
        displayName: displayName.trim(),
      })

      // Hydrate /auth/me before navigating so the matrix sees BUYER + DRAFT
      // and lands us on the wizard-draft screen rather than flashing the
      // onboarding-intent redirect.
      await refreshAuthMe()
      router.push('/dashboard')
    } catch (err) {
      await handleCreateError(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateError(err: unknown) {
    const error = err as { status?: number; data?: { message?: string | string[] } }
    const status = error.status
    const messageRaw = error.data?.message
    const message = typeof messageRaw === 'string' ? messageRaw : ''

    if (status === 409 && /you already have a store/i.test(message)) {
      // Matrix was wrong — user already has a store. Refresh + reroute.
      await refreshAuthMe()
      router.push('/dashboard')
      return
    }

    if (status === 409 && /company name/i.test(message)) {
      setCompanyNameError('That company name is already taken. Try a different one.')
      return
    }

    if (status === 409 && /display name/i.test(message)) {
      setDisplayNameError('That brand name is already taken. Try a different one.')
      return
    }

    if (status === 400 && Array.isArray(messageRaw)) {
      let matched = false
      for (const msg of messageRaw) {
        if (/^companyName/i.test(msg)) {
          setCompanyNameError(cleanValidationMessage(msg))
          matched = true
        } else if (/^displayName/i.test(msg)) {
          setDisplayNameError(cleanValidationMessage(msg))
          matched = true
        }
      }
      if (!matched) {
        setBannerError('Please check the fields below and try again.')
      }
      return
    }

    if (status === 429) {
      setBannerError('Too many attempts. Please wait a moment and try again.')
      return
    }

    setBannerError('Something went wrong. Please try again.')
  }

  if (mode === 'creating') {
    return (
      <div className="flex w-full max-w-xl flex-col gap-8">
        <button
          type="button"
          onClick={() => setMode('picker')}
          disabled={loading}
          className="self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          ← Back
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-foreground">Set up your store</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us about your brand to get started. You can change any of this later.
          </p>
        </div>

        {bannerError && <Alert variant="error">{bannerError}</Alert>}

        <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Input
              id="companyName"
              label="Registered company name"
              type="text"
              placeholder="e.g. Khanyi Creative Ventures (Pty) Ltd"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              error={companyNameError ?? undefined}
              disabled={loading}
              required
            />
            {!companyNameError && (
              <p className="text-xs text-muted-foreground">
                Your company name as it appears on your CIPC registration.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Input
              id="displayName"
              label="Brand name"
              type="text"
              placeholder="e.g. BOLD Streetwear"
              autoComplete="off"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={displayNameError ?? undefined}
              disabled={loading}
              required
            />
            {!displayNameError && (
              <p className="text-xs text-muted-foreground">
                What buyers will see. This becomes your store&apos;s name on YIIVA.
              </p>
            )}
          </div>

          <Button type="submit" loading={loading}>
            Continue
          </Button>
        </form>
      </div>
    )
  }

  // mode === 'picker'
  return (
    <div className="flex w-full max-w-3xl flex-col gap-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">Welcome, {user.firstName}.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ready to start selling on YIIVA?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setShowShopExplainer(false)
            setMode('creating')
          }}
          className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-brand hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-brand">
            <StoreIcon className="text-muted-foreground transition-colors group-hover:text-brand-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">Start my store</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Set up your store, list your products, and start reaching buyers across South Africa.
            </p>
          </div>
          <span className="mt-auto text-sm font-medium text-foreground group-hover:underline">
            Continue →
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/onboarding/shopify')}
          className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-brand hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-brand">
            <ImportIcon className="text-muted-foreground transition-colors group-hover:text-brand-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">Import from Shopify</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Already selling on Shopify? Bring your products, images and collections across in minutes.
            </p>
          </div>
          <span className="mt-auto text-sm font-medium text-foreground group-hover:underline">
            Continue →
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowShopExplainer((v) => !v)}
          className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-brand hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-brand">
            <BagIcon className="text-muted-foreground transition-colors group-hover:text-brand-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">I&apos;m just looking around</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Browsing for products? You&apos;ll want our consumer app.
            </p>
          </div>
        </button>
      </div>

      {showShopExplainer && (
        <div className="rounded-xl border border-border bg-muted p-6 text-sm text-foreground">
          <p className="leading-relaxed">
            This is the merchant dashboard for sellers. To shop on YIIVA, download our consumer app
            from the App Store or Play Store.
          </p>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
      )}

      <WereYouInvitedLink />
    </div>
  )
}

// Lightly tidy validation messages from the backend (e.g. "companyName must be
// longer than or equal to 2 characters") for inline display. We capitalise the
// first letter and ensure the message ends in a period.
function cleanValidationMessage(raw: string): string {
  const trimmed = raw.replace(/\.$/, '')
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + '.'
}

function ImportIcon({ className }: { className?: string }) {
  // Download-into-tray — "bring your catalogue in".
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  )
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </svg>
  )
}
