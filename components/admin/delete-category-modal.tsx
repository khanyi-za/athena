'use client'

import { useEffect } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { CategoryTreeNode } from '@/lib/schemas/category'

// Delete-category modal per product-frontend-flows §10.4. Three distinct
// blocked-by paths:
//   1. children — known client-side (node.children.length), show immediately
//   2. linked products — only known on backend 409, swap on error
//   3. store associations — only known on backend 409, swap on error
//
// On success: close + refetch (handled by caller). Generic 409 messages we
// don't recognise fall through to a plain error alert.

type BlockedReason = 'children' | 'products' | 'stores' | null

interface DeleteCategoryModalProps {
  target: CategoryTreeNode
  onCancel: () => void
  onConfirm: () => Promise<void>
  /** When a 409 fires, the caller forwards the message string so we can
   *  classify which of the three blocked-by reasons applies. */
  blockedMessage: string | null
  loading: boolean
  /** Non-409 errors (network, server). */
  error: string | null
  onEditChild?: (child: CategoryTreeNode) => void
}

export function DeleteCategoryModal({
  target,
  onCancel,
  onConfirm,
  blockedMessage,
  loading,
  error,
  onEditChild,
}: DeleteCategoryModalProps) {
  // Pre-block children case from client-side data — we already know if
  // children exist without making an API call.
  const childrenBlocked = target.children.length > 0

  // Backend-detected blocked reason from the 409 message body.
  const backendBlocked: BlockedReason = (() => {
    if (!blockedMessage) return null
    if (/child categories/i.test(blockedMessage)) return 'children'
    if (/products linked/i.test(blockedMessage)) return 'products'
    if (/stores are associated|store associations/i.test(blockedMessage)) return 'stores'
    return null
  })()

  const blocked: BlockedReason = childrenBlocked ? 'children' : backendBlocked

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  useBodyScrollLock()

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="delete-category-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {blocked === 'children' ? (
          <ChildrenBlockedBody
            target={target}
            onEditChild={onEditChild}
            onCancel={onCancel}
          />
        ) : blocked === 'products' ? (
          <ProductsBlockedBody target={target} onCancel={onCancel} />
        ) : blocked === 'stores' ? (
          <StoresBlockedBody target={target} onCancel={onCancel} />
        ) : (
          <ConfirmDeleteBody
            target={target}
            onConfirm={onConfirm}
            onCancel={onCancel}
            loading={loading}
            error={error ?? (blockedMessage && !backendBlocked ? blockedMessage : null)}
          />
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-bodies
// ----------------------------------------------------------------------------

function ConfirmDeleteBody({
  target,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  target: CategoryTreeNode
  onConfirm: () => Promise<void>
  onCancel: () => void
  loading: boolean
  error: string | null
}) {
  return (
    <>
      <h2 id="delete-category-modal-title" className="text-lg font-semibold text-foreground">
        Delete &quot;{target.name}&quot;?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        No children, products, or store associations are linked here — safe to
        delete. This can&apos;t be undone.
      </p>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
          onClick={() => {
            void onConfirm()
          }}
          loading={loading}
          className="!bg-danger !text-danger-foreground hover:!bg-danger/90"
        >
          Delete category
        </Button>
      </div>
    </>
  )
}

function ChildrenBlockedBody({
  target,
  onEditChild,
  onCancel,
}: {
  target: CategoryTreeNode
  onEditChild?: (child: CategoryTreeNode) => void
  onCancel: () => void
}) {
  return (
    <>
      <h2 id="delete-category-modal-title" className="text-lg font-semibold text-foreground">
        Can&apos;t delete &quot;{target.name}&quot;
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        This category has {target.children.length} child{' '}
        {target.children.length === 1 ? 'category' : 'categories'}. Move or
        delete the children first, then come back to delete this one.
      </p>

      <ul className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border">
        {target.children.map((child) => (
          <li
            key={child.id}
            className="flex items-center justify-between px-3 py-2 text-sm"
          >
            <span className="text-foreground">
              {child.name}
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {child.slug}
              </span>
            </span>
            {onEditChild && (
              <button
                type="button"
                onClick={() => onEditChild(child)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                Edit
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-end">
        <Button type="button" fullWidth={false} onClick={onCancel}>
          Got it
        </Button>
      </div>
    </>
  )
}

function ProductsBlockedBody({
  target,
  onCancel,
}: {
  target: CategoryTreeNode
  onCancel: () => void
}) {
  return (
    <>
      <h2 id="delete-category-modal-title" className="text-lg font-semibold text-foreground">
        Can&apos;t delete &quot;{target.name}&quot;
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        This category has products linked to it. Re-categorise those products
        first — once nothing is linked here, you&apos;ll be able to delete it.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Tip: ask the affected merchants to update their products, or
        re-categorise them yourself from the admin product view.
      </p>

      <div className="mt-6 flex justify-end">
        <Button type="button" fullWidth={false} onClick={onCancel}>
          Got it
        </Button>
      </div>
    </>
  )
}

function StoresBlockedBody({
  target,
  onCancel,
}: {
  target: CategoryTreeNode
  onCancel: () => void
}) {
  return (
    <>
      <h2 id="delete-category-modal-title" className="text-lg font-semibold text-foreground">
        Can&apos;t delete &quot;{target.name}&quot;
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Stores are associated with this category. Remove the store associations
        first, then come back to delete it.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Store-category associations are managed in a separate admin tool that
        isn&apos;t built yet.
      </p>

      <div className="mt-6 flex justify-end">
        <Button type="button" fullWidth={false} onClick={onCancel}>
          Got it
        </Button>
      </div>
    </>
  )
}
