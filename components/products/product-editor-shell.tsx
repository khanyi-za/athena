'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'

import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { PRODUCT_STATUS } from '@/lib/product-status'
import { useProduct, useInvalidateProduct } from '@/hooks/use-product'
import { useInvalidateProducts } from '@/hooks/use-products'
import { useInvalidateActiveProductCount } from '@/hooks/use-active-product-count'
import { useInvalidateStoreMe } from '@/hooks/use-store-me'
import { activateProduct, archiveProduct, deleteProduct } from '@/lib/api/products'
import type { Product } from '@/lib/schemas/product'

import {
  productToFormValues,
  type ProductEditorFormValues,
} from '@/components/products/product-form-values'
import { ActivationReadinessPanel } from '@/components/products/activation-readiness-panel'
import { ProductLifecycleActions } from '@/components/products/product-lifecycle-actions'
import { BasicsSection } from '@/components/products/sections/basics-section'
import { ImagesSection } from '@/components/products/sections/images-section'
import { CollectionsSection } from '@/components/products/sections/collections-section'
import { ActivateProductModal } from '@/components/products/activate-product-modal'
import { ArchiveProductModal } from '@/components/products/archive-product-modal'
import { DeleteProductModal } from '@/components/products/delete-product-modal'

// Product editor — section-based layout with sticky side nav + main content.
// Owns:
//   - Form state (RHF for Basics)
//   - Lifecycle modal state (activate / archive / delete)
//   - Activation multi-error banner (the string-array 400 response gets
//     surfaced at the top of the editor per product-frontend-flows §5.3)

type LifecycleModal =
  | { kind: 'none' }
  | { kind: 'activating' }
  | { kind: 'archiving' }
  | { kind: 'deleting' }

interface ProductEditorShellProps {
  storeId: string
  productId: string
}

export function ProductEditorShell({ storeId, productId }: ProductEditorShellProps) {
  const { data: product, isLoading, isError } = useProduct(storeId, productId)

  if (isLoading) return <LoadingState />
  if (isError || !product) return <NotFoundState />

  return <ProductEditorForm product={product} storeId={storeId} />
}

function ProductEditorForm({ product, storeId }: { product: Product; storeId: string }) {
  const router = useRouter()
  const invalidateProduct = useInvalidateProduct()
  const invalidateProducts = useInvalidateProducts()
  const invalidateActiveProductCount = useInvalidateActiveProductCount()
  const invalidateStoreMe = useInvalidateStoreMe()

  const isArchived = product.status === 'ARCHIVED'

  const form = useForm<ProductEditorFormValues>({
    defaultValues: productToFormValues(product),
    mode: 'onBlur',
  })

  const formValues = useWatch({ control: form.control }) as Partial<ProductEditorFormValues>

  const [modal, setModal] = useState<LifecycleModal>({ kind: 'none' })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [activationErrors, setActivationErrors] = useState<string[] | null>(null)

  function closeModal() {
    if (actionLoading) return
    setModal({ kind: 'none' })
    setActionError(null)
  }

  function openActivate() {
    setActionError(null)
    setActivationErrors(null)
    setModal({ kind: 'activating' })
  }

  function openArchive() {
    setActionError(null)
    setModal({ kind: 'archiving' })
  }

  function openDelete() {
    setActionError(null)
    setModal({ kind: 'deleting' })
  }

  function handleSavedRemote() {
    invalidateProduct(storeId, product.id)
  }

  function refreshProductAndDependents() {
    invalidateProduct(storeId, product.id)
    invalidateProducts(storeId)
    invalidateActiveProductCount(storeId)
    invalidateStoreMe()
  }

  async function handleActivate() {
    setActionLoading(true)
    setActionError(null)
    try {
      await activateProduct(storeId, product.id)
      refreshProductAndDependents()
      setModal({ kind: 'none' })
      // Launch is the moment a product goes live — send the merchant back to
      // the inventory so they see it sitting at ACTIVE in context with the
      // rest of their catalogue.
      router.push('/dashboard/products')
      return
    } catch (err) {
      const error = err as { status?: number; data?: { message?: string | string[] } }
      const status = error.status
      const messageRaw = error.data?.message

      // Multi-error response: surface inline at the top of the editor.
      if (status === 400 && Array.isArray(messageRaw)) {
        setActivationErrors(messageRaw)
        setModal({ kind: 'none' })
        invalidateProduct(storeId, product.id) // refresh in case state was stale
        return
      }

      if (status === 409) {
        setActionError('This product is archived. Create a new product instead.')
        return
      }

      setActionError('Something went wrong. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleArchive() {
    setActionLoading(true)
    setActionError(null)
    try {
      await archiveProduct(storeId, product.id)
      refreshProductAndDependents()
      setModal({ kind: 'none' })
    } catch (err) {
      const error = err as { status?: number; data?: { message?: string | string[] } }
      const message =
        typeof error.data?.message === 'string' ? error.data.message : ''

      if (error.status === 409 && /draft/i.test(message)) {
        // Should never reach — UI hides Archive on DRAFT. Defensive copy.
        setActionError('Drafts can&apos;t be archived. Delete instead.')
        return
      }

      setActionError('Something went wrong. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    setActionError(null)
    try {
      await deleteProduct(storeId, product.id)
      invalidateProducts(storeId)
      invalidateActiveProductCount(storeId)
      router.push('/dashboard/products')
    } catch (err) {
      const error = err as { status?: number; data?: { message?: string | string[] } }
      const message =
        typeof error.data?.message === 'string' ? error.data.message : ''

      if (error.status === 409 && /only draft/i.test(message)) {
        setActionError('Only draft products can be deleted. Use archive instead.')
        return
      }

      if (error.status === 404) {
        // Already gone — proceed to list.
        invalidateProducts(storeId)
        router.push('/dashboard/products')
        return
      }

      setActionError('Something went wrong. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/products"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to products
        </Link>
      </div>

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{product.title}</h1>
        <Badge tone={PRODUCT_STATUS[product.status].tone} dot>{PRODUCT_STATUS[product.status].label}</Badge>
      </header>

      {isArchived && (
        <div
          role="alert"
          className="rounded-lg border border-border bg-muted p-4 text-sm text-foreground"
        >
          This product is archived. It&apos;s not visible to buyers, and you can&apos;t edit it.
          To bring something similar back, create a new product.
        </div>
      )}

      {activationErrors && activationErrors.length > 0 && (
        <Alert variant="error">
          <div className="flex flex-col gap-2">
            <p className="font-medium">Couldn&apos;t activate your product yet.</p>
            <ul className="list-disc pl-5 text-sm">
              {activationErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
            <p className="text-sm">Fix these and try again.</p>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <SectionNav />
          <ActivationReadinessPanel
            product={product}
            formValues={formValues}
            onActivate={openActivate}
            isActivating={actionLoading && modal.kind === 'activating'}
          />
          <ProductLifecycleActions
            status={product.status}
            onArchive={openArchive}
            onDelete={openDelete}
          />
        </aside>

        <main className="flex flex-col gap-12">
          <BasicsSection
            control={form.control}
            storeId={storeId}
            product={product}
            onSavedRemote={handleSavedRemote}
          />
          <ImagesSection storeId={storeId} product={product} />
          <CollectionsSection storeId={storeId} product={product} />
        </main>
      </div>

      {modal.kind === 'activating' && (
        <ActivateProductModal
          productTitle={product.title}
          onCancel={closeModal}
          onConfirm={handleActivate}
          loading={actionLoading}
          error={actionError}
        />
      )}

      {modal.kind === 'archiving' && (
        <ArchiveProductModal
          productTitle={product.title}
          onCancel={closeModal}
          onConfirm={handleArchive}
          loading={actionLoading}
          error={actionError}
        />
      )}

      {modal.kind === 'deleting' && (
        <DeleteProductModal
          productTitle={product.title}
          onCancel={closeModal}
          onConfirm={handleDelete}
          loading={actionLoading}
          error={actionError}
        />
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Side nav
// ----------------------------------------------------------------------------

function SectionNav() {
  const items = [
    { href: '#section-basics', label: 'Basics' },
    { href: '#section-images', label: 'Media' },
    { href: '#section-collections', label: 'Collections' },
  ]
  return (
    <nav className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sections</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ----------------------------------------------------------------------------
// Loading / 404 states
// ----------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand"
      />
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">Product not found</h2>
      <p className="text-sm text-muted-foreground">
        This product doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/dashboard/products"
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
      >
        Back to products
      </Link>
    </div>
  )
}
