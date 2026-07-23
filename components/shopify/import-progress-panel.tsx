'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { ShopifyImportJob } from '@/lib/schemas/shopify'

// Status-aware import display: PENDING/PULLING spinner → IMPORTING progress
// bar → COMPLETED summary / FAILED retry. Shared by onboarding + settings.

const STALL_AFTER_MS = 15 * 60 * 1000

// Helper (not inline in render — Date.now is impure per the compiler lint;
// same pattern as autosave-indicator's formatRelativeTime).
function isStalled(job: ShopifyImportJob): boolean {
  return (
    job.status === 'RUNNING' &&
    job.startedAt != null &&
    Date.now() - job.startedAt.getTime() > STALL_AFTER_MS
  )
}

interface Props {
  job: ShopifyImportJob
  onRetry?: () => void
  retrying?: boolean
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Loader2 size={18} className="animate-spin text-brand" />
      {label}
    </div>
  )
}

export function ImportProgressPanel({ job, onRetry, retrying }: Props) {
  const summary = job.summary

  if (job.status === 'FAILED') {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="error">
          <p className="font-medium">The import stopped before finishing.</p>
          {job.error && <p className="mt-1">{job.error}</p>}
          <p className="mt-1">
            Products that were already imported have been kept — running the
            import again skips them and continues where it left off.
          </p>
        </Alert>
        {onRetry && (
          <Button onClick={onRetry} loading={retrying} fullWidth={false} className="self-start">
            Try again
          </Button>
        )}
      </div>
    )
  }

  if (job.status === 'COMPLETED') {
    const skipped =
      (summary?.productsSkippedExisting ?? 0) + (summary?.productsSkippedNoImage ?? 0)
    const rows: { label: string; value: string }[] = [
      { label: 'Products imported', value: String(summary?.productsImported ?? 0) },
      { label: 'Variants', value: String(summary?.variantsImported ?? 0) },
      {
        label: 'Images',
        value:
          (summary?.imagesFailed ?? 0) > 0
            ? `${summary?.imagesUploaded ?? 0} (${summary?.imagesFailed} failed)`
            : String(summary?.imagesUploaded ?? 0),
      },
      { label: 'Collections', value: String(summary?.collectionsCreated ?? 0) },
      ...(skipped > 0 ? [{ label: 'Skipped', value: String(skipped) }] : []),
      ...((summary?.productsFailed ?? 0) > 0
        ? [{ label: 'Failed', value: String(summary?.productsFailed) }]
        : []),
    ]
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CheckCircle2 size={16} className="text-success" />
          Import complete
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-lg font-semibold text-foreground">{r.value}</p>
              <p className="text-xs text-muted-foreground">{r.label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // PENDING or RUNNING
  if (!summary || summary.phase === 'PULLING') {
    return (
      <Spinner
        label={
          !summary ? 'Starting import…' : 'Reading your Shopify catalogue…'
        }
      />
    )
  }

  const total = summary.totalProducts ?? 0
  const imported = summary.productsImported ?? 0
  const pct = total > 0 ? Math.min(100, Math.round((imported / total) * 100)) : 0
  const stalled = isStalled(job)

  return (
    <div className="flex flex-col gap-2">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {imported} of {total} products · {summary.imagesUploaded ?? 0} images ·{' '}
        {summary.collectionsCreated ?? 0} collections
      </p>
      {stalled && (
        <p className="text-xs text-muted-foreground">
          Still running — very large catalogues can take a while. If this never
          finishes, it&apos;s safe to start the import again: products already
          imported are kept and skipped.
        </p>
      )}
    </div>
  )
}
