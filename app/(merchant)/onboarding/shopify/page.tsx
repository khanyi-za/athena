'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { resolveDashboardView } from '@/lib/routing-matrix'
import { fetchAuthMe } from '@/lib/fetch-auth-me'
import {
  useDisconnectShopify,
  useLatestShopifyImport,
  useShopifyConnection,
  useShopifyImportPreview,
  useStartShopifyImport,
} from '@/hooks/use-shopify'
import { shopifyErrorCode } from '@/lib/api/shopify'
import type {
  GenderType,
  ShopifyConnection,
  ShopifyImportJob,
} from '@/lib/schemas/shopify'
import { ShopifyConnectForm } from '@/components/shopify/shopify-connect-form'
import { ImportPreviewPanel } from '@/components/shopify/import-preview-panel'
import { ImportProgressPanel } from '@/components/shopify/import-progress-panel'

// Import-from-Shopify onboarding flow: connect → preview → importing → done.
//
// The step is DERIVED from server state (connection + latest job), never
// stored: every transition the flow makes — connect, start import, job
// completes — lands in the query cache, so reload/return resumes in the
// right place for free. The nuwa import CREATES the DRAFT store, so the
// routing matrix starts answering `wizard-draft` mid-flow — the guard must
// allow both states; "done" hands over to the normal store wizard, prefilled.

type Step = 'resolving' | 'connect' | 'preview' | 'importing' | 'done'

function deriveStep(opts: {
  pending: boolean
  conn: ShopifyConnection | null | undefined
  job: ShopifyImportJob | null | undefined
}): Step {
  if (opts.pending) return 'resolving'
  const jobStatus = opts.job?.status
  if (jobStatus === 'PENDING' || jobStatus === 'RUNNING') return 'importing'
  if (jobStatus === 'COMPLETED') return 'done'
  // FAILED falls to preview (retry lives there); no job likewise.
  if (opts.conn && opts.conn.currencySupported) return 'preview'
  return 'connect'
}

export default function ShopifyOnboardingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)
  const isInitializing = useAuthStore((s) => s.isInitializing)

  const view = user ? resolveDashboardView(user) : null
  const allowed =
    view?.kind === 'onboarding-intent' || view?.kind === 'wizard-draft'

  const connection = useShopifyConnection()
  const latestImport = useLatestShopifyImport()
  const startImport = useStartShopifyImport()
  const disconnect = useDisconnectShopify()

  const [defaultGenderType, setDefaultGenderType] = useState<GenderType>('UNISEX')
  const [startError, setStartError] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  const conn = connection.data
  const job = latestImport.data
  const step = deriveStep({
    pending: connection.isPending || latestImport.isPending,
    conn,
    job,
  })
  const importFailed = job?.status === 'FAILED'
  const currencyBlocked = conn != null && !conn.currencySupported

  const preview = useShopifyImportPreview(step === 'preview')

  useEffect(() => {
    if (isInitializing || !view) return
    if (!allowed) router.replace('/dashboard')
  }, [isInitializing, view, allowed, router])

  if (isInitializing || !user || !view || !allowed || step === 'resolving') {
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

  function handleStartImport() {
    setStartError(null)
    startImport.mutate(
      { defaultGenderType },
      {
        // onSuccess seeds the job cache with the PENDING job → step derives
        // to 'importing' and the poller takes over. No transition to make.
        onError: (err) => {
          const code = shopifyErrorCode(err)
          if (code === 'IMPORT_ALREADY_RUNNING') {
            // Not an error — pull the live job; step derives to 'importing'.
            latestImport.refetch()
            return
          }
          if (code === 'STORE_NAME_TAKEN') {
            setStartError(
              `${(err as Error).message} You can also go back and create your store manually with a different name.`,
            )
            return
          }
          setStartError((err as Error).message || 'Something went wrong. Please try again.')
        },
      },
    )
  }

  async function handleFinish() {
    setFinishing(true)
    // Hydrate /auth/me before navigating so the matrix sees BUYER + DRAFT
    // and lands on the wizard (prefilled) without flashing a redirect.
    await refreshAuthMe()
    router.push('/dashboard')
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      {(step === 'connect' || step === 'preview') && (
        <button
          type="button"
          onClick={() => router.push('/onboarding')}
          className="flex items-center gap-1 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      )}

      {step === 'connect' && (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Import your store from Shopify
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your Shopify store and we&apos;ll bring your products,
              images, collections and stock levels across — then keep stock in
              sync automatically.
            </p>
          </div>

          {currencyBlocked && (
            <Alert variant="error">
              <p className="font-medium">
                {conn.shopName ?? conn.shopDomain} trades in {conn.currencyCode}.
              </p>
              <p className="mt-1">
                YIIVA is ZAR-only, so this catalogue can&apos;t be imported —
                prices can&apos;t be converted honestly. You can connect a
                different shop below, or{' '}
                <button
                  type="button"
                  onClick={() => router.push('/onboarding')}
                  className="font-medium underline"
                >
                  create your store manually
                </button>
                .
              </p>
              <button
                type="button"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
                className="mt-2 text-sm font-medium underline disabled:opacity-50"
              >
                {disconnect.isPending ? 'Disconnecting…' : 'Disconnect this shop'}
              </button>
            </Alert>
          )}

          {/* On success the connection cache updates and step derives to
              'preview' (or stays here with the blocked alert for non-ZAR). */}
          <ShopifyConnectForm onConnected={() => {}} />
        </>
      )}

      {step === 'preview' && (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Here&apos;s what we&apos;ll import
            </h1>
            {conn && (
              <p className="mt-2 text-sm text-muted-foreground">
                From {conn.shopName ?? conn.shopDomain}
                {conn.websiteDomain ? ` (${conn.websiteDomain})` : ''}.
              </p>
            )}
          </div>

          {importFailed && job && (
            <ImportProgressPanel
              job={job}
              onRetry={handleStartImport}
              retrying={startImport.isPending}
            />
          )}

          {preview.isPending && (
            <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
              <Loader2 size={24} className="animate-spin text-brand" />
              Reading your catalogue… this can take a minute for large shops.
            </div>
          )}

          {preview.isError &&
            (shopifyErrorCode(preview.error) === 'SHOP_CURRENCY_UNSUPPORTED' ? (
              <Alert variant="error">
                {(preview.error as Error).message} You can{' '}
                <button
                  type="button"
                  onClick={() => router.push('/onboarding')}
                  className="font-medium underline"
                >
                  create your store manually
                </button>{' '}
                instead.
              </Alert>
            ) : (
              <div className="flex flex-col gap-3">
                <Alert variant="error">
                  {(preview.error as Error).message ||
                    'We couldn’t read your catalogue. Please try again.'}
                </Alert>
                <Button
                  onClick={() => preview.refetch()}
                  fullWidth={false}
                  variant="ghost"
                  className="self-start"
                >
                  Try again
                </Button>
              </div>
            ))}

          {preview.data && !importFailed && (
            <ImportPreviewPanel
              preview={preview.data}
              defaultGenderType={defaultGenderType}
              onGenderChange={setDefaultGenderType}
              onStartImport={handleStartImport}
              starting={startImport.isPending}
              startError={startError}
            />
          )}
        </>
      )}

      {step === 'importing' && (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Importing your catalogue
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This usually takes a minute or two — we&apos;re copying your
              products and re-hosting every image. You can leave this page;
              the import keeps running.
            </p>
          </div>
          {job ? (
            <ImportProgressPanel
              job={job}
              onRetry={handleStartImport}
              retrying={startImport.isPending}
            />
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 size={18} className="animate-spin text-brand" />
              Starting import…
            </div>
          )}
        </>
      )}

      {step === 'done' && (
        <>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <CheckCircle2 size={24} className="text-success" />
              Your catalogue is in
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {job?.summary?.productsImported ?? 'Your'} products are now in
              your new YIIVA store, and your Shopify stock levels will stay in
              sync automatically.
            </p>
          </div>
          {job && <ImportProgressPanel job={job} />}
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Next: finish your store profile</p>
            <p className="mt-1">
              We&apos;ve prefilled what we could from Shopify. Add your contact
              details, business registration and payout info, then submit your
              store for review — it goes live once approved.
            </p>
          </div>
          <Button onClick={handleFinish} loading={finishing} fullWidth={false} className="self-start">
            Finish setting up my store
          </Button>
        </>
      )}
    </div>
  )
}
