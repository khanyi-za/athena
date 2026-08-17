'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Store as StoreIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useDisconnectShopify,
  useLatestShopifyImport,
  useShopifyConnection,
  useShopifyImportPreview,
  useStartShopifyImport,
} from '@/hooks/use-shopify'
import { shopifyErrorCode } from '@/lib/api/shopify'
import type { GenderType } from '@/lib/schemas/shopify'
import { ShopifyConnectForm } from '@/components/shopify/shopify-connect-form'
import { ImportPreviewPanel } from '@/components/shopify/import-preview-panel'
import { ImportProgressPanel } from '@/components/shopify/import-progress-panel'

/**
 * Shopify sync (settings) — connect an existing store's Shopify shop, run
 * imports into it, and disconnect. The import targets the merchant's OWN
 * store (nuwa imports into an existing store when one exists). New products
 * import; already-imported slugs are skipped, so re-runs are safe refreshes.
 */
export function ShopifySection() {
  const connection = useShopifyConnection()
  const disconnect = useDisconnectShopify()
  const startImport = useStartShopifyImport()

  const conn = connection.data
  const latestImport = useLatestShopifyImport({ enabled: !!conn })

  const [showConnectForm, setShowConnectForm] = useState(false)
  const [importFlow, setImportFlow] = useState<'idle' | 'preview'>('idle')
  const [defaultGenderType, setDefaultGenderType] = useState<GenderType>('UNISEX')
  const [startError, setStartError] = useState<string | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const preview = useShopifyImportPreview(importFlow === 'preview')

  const jobLive =
    latestImport.data?.status === 'PENDING' ||
    latestImport.data?.status === 'RUNNING'

  // The disconnect confirm arms for a few seconds, then stands down.
  useEffect(() => {
    if (!confirmDisconnect) return
    const timer = setTimeout(() => setConfirmDisconnect(false), 5000)
    return () => clearTimeout(timer)
  }, [confirmDisconnect])

  function handleStartImport() {
    setStartError(null)
    startImport.mutate(
      { defaultGenderType },
      {
        onSuccess: () => setImportFlow('idle'), // progress block takes over
        onError: (err) => {
          if (shopifyErrorCode(err) === 'IMPORT_ALREADY_RUNNING') {
            setImportFlow('idle')
            return
          }
          setStartError((err as Error).message || 'Something went wrong. Please try again.')
        },
      },
    )
  }

  return (
    <section id="section-shopify" className="flex flex-col gap-6 scroll-mt-6">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Shopify sync</h2>
          {conn ? (
            <Badge tone="success" dot>
              Connected
            </Badge>
          ) : (
            <Badge tone="neutral">Not connected</Badge>
          )}
          {conn && !conn.currencySupported && (
            <Badge tone="warning" dot>
              Currency not supported ({conn.currencyCode})
            </Badge>
          )}
        </div>
      </header>

      <p className="text-sm text-muted-foreground">
        Connect your Shopify store to import your catalogue — products,
        variants, images and collections — and keep stock in sync: Shopify
        stock changes flow to YIIVA, and YIIVA sales reduce your Shopify stock
        automatically.
      </p>

      {connection.isPending ? (
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      ) : !conn || showConnectForm ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
          {showConnectForm && (
            <p className="text-sm text-muted-foreground">
              Paste your app&apos;s Client ID and Client secret to update the
              connection — the shop stays linked and nothing is re-imported.
            </p>
          )}
          <ShopifyConnectForm
            submitLabel={conn ? 'Update credentials' : 'Connect Shopify'}
            onConnected={() => setShowConnectForm(false)}
          />
          {showConnectForm && (
            <button
              onClick={() => setShowConnectForm(false)}
              className="self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <StoreIcon size={20} className="text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {conn.shopName ?? conn.shopDomain}
                </p>
                <p className="text-xs text-muted-foreground">
                  {conn.shopDomain}
                  {conn.productsCount !== undefined
                    ? ` · ${conn.productsCount} products on Shopify`
                    : ''}{' '}
                  · connected{' '}
                  {conn.connectedAt.toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 size={12} className="text-success" />
                  Orders on YIIVA reduce your Shopify stock automatically
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConnectForm(true)}
              className="shrink-0 text-sm font-medium text-primary transition-colors hover:underline"
            >
              Update credentials
            </button>
          </div>

          {latestImport.data && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {jobLive ? 'Import in progress' : 'Latest import'}
              </h3>
              <ImportProgressPanel
                job={latestImport.data}
                onRetry={handleStartImport}
                retrying={startImport.isPending}
              />
            </div>
          )}

          {importFlow === 'preview' && !jobLive && (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Import products from Shopify
                </h3>
                <button
                  onClick={() => setImportFlow('idle')}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
              {preview.isPending ? (
                <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand" />
                  Reading your catalogue… this can take a minute for large shops.
                </p>
              ) : preview.isError ? (
                <p className="text-sm text-danger">
                  {(preview.error as Error).message ||
                    'We couldn’t read your catalogue. Please try again.'}
                </p>
              ) : preview.data ? (
                <ImportPreviewPanel
                  compact
                  preview={preview.data}
                  defaultGenderType={defaultGenderType}
                  onGenderChange={setDefaultGenderType}
                  onStartImport={handleStartImport}
                  starting={startImport.isPending}
                  startError={startError}
                />
              ) : null}
            </div>
          )}

          <div className="flex items-center gap-3">
            {importFlow === 'idle' && (
              <Button
                onClick={() => setImportFlow('preview')}
                disabled={jobLive || !conn.currencySupported}
                fullWidth={false}
                variant="ghost"
              >
                {jobLive ? 'Import in progress…' : 'Import products now'}
              </Button>
            )}
            {confirmDisconnect ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Stops stock sync and future imports; imported products stay in
                  your store.
                </span>
                <Button
                  onClick={() => {
                    setConfirmDisconnect(false)
                    disconnect.mutate()
                  }}
                  loading={disconnect.isPending}
                  fullWidth={false}
                  variant="danger"
                >
                  Yes, disconnect
                </Button>
                <button
                  onClick={() => setConfirmDisconnect(false)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisconnect(true)}
                className="text-sm font-medium text-danger transition-colors hover:underline"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
