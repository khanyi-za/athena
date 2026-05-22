'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { CategoryFormModal } from '@/components/admin/category-form-modal'
import { CategoryTree } from '@/components/admin/category-tree'
import { DeleteCategoryModal } from '@/components/admin/delete-category-modal'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/lib/api/categories'
import {
  useCategoriesTree,
  useInvalidateCategoriesTree,
} from '@/hooks/use-categories-tree'
import type { CategoryTreeNode } from '@/lib/schemas/category'

// Platform-category management. Per admin-journey §6, this is "occasional"
// work — 1–5 actions per month after the initial taxonomy is seeded. The UI
// optimises for clarity over throughput.
//
// Per product-frontend-flows §10:
//  - Tree view with collapse/expand + edit/delete/add-child actions per node
//  - Create / edit share one form; parent picker disables cycle-causing options
//  - Delete with three distinct blocked-by recovery paths (children / products /
//    store associations)

type Modal =
  | { kind: 'none' }
  | { kind: 'create'; defaultParent: CategoryTreeNode | null }
  | { kind: 'edit'; target: CategoryTreeNode }
  | { kind: 'delete'; target: CategoryTreeNode }

export default function AdminCategoriesPage() {
  const { data: tree, isLoading, isError } = useCategoriesTree()
  const invalidate = useInvalidateCategoriesTree()

  const [modal, setModal] = useState<Modal>({ kind: 'none' })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(
    null,
  )
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function closeModal() {
    if (loading) return
    setModal({ kind: 'none' })
    setFormError(null)
    setDeleteBlockedMessage(null)
    setDeleteError(null)
  }

  function openCreate(defaultParent: CategoryTreeNode | null) {
    setFormError(null)
    setModal({ kind: 'create', defaultParent })
  }

  function openEdit(target: CategoryTreeNode) {
    setFormError(null)
    setModal({ kind: 'edit', target })
  }

  function openDelete(target: CategoryTreeNode) {
    setDeleteBlockedMessage(null)
    setDeleteError(null)
    setModal({ kind: 'delete', target })
  }

  async function handleFormSubmit(values: {
    name: string
    description?: string
    imageUrl?: string
    parentId: string | null
    sortOrder?: number
  }) {
    if (modal.kind !== 'create' && modal.kind !== 'edit') return

    setLoading(true)
    setFormError(null)
    try {
      if (modal.kind === 'create') {
        await createCategory({
          name: values.name,
          description: values.description,
          imageUrl: values.imageUrl,
          parentId: values.parentId ?? undefined,
          sortOrder: values.sortOrder,
        })
      } else {
        await updateCategory(modal.target.id, {
          name: values.name,
          description: values.description,
          imageUrl: values.imageUrl,
          parentId: values.parentId,
          sortOrder: values.sortOrder,
        })
      }
      await invalidate()
      setModal({ kind: 'none' })
    } catch (err) {
      handleFormError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleFormError(err: unknown) {
    const e = err as { status?: number; data?: { message?: string | string[] } }
    const message =
      typeof e.data?.message === 'string'
        ? e.data.message
        : Array.isArray(e.data?.message)
          ? e.data.message.join(' · ')
          : ''

    if (e.status === 400 && /cycle/i.test(message)) {
      setFormError("Can't move this category here — it would create a loop in the tree.")
      return
    }
    if (e.status === 409) {
      setFormError(message || 'A category with that name or slug already exists.')
      return
    }
    if (e.status === 400 && message) {
      setFormError(message)
      return
    }
    setFormError('Something went wrong. Please try again.')
  }

  async function handleDelete() {
    if (modal.kind !== 'delete') return
    setLoading(true)
    setDeleteBlockedMessage(null)
    setDeleteError(null)
    try {
      await deleteCategory(modal.target.id)
      await invalidate()
      setModal({ kind: 'none' })
    } catch (err) {
      handleDeleteError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteError(err: unknown) {
    const e = err as { status?: number; data?: { message?: string | string[] } }
    const message =
      typeof e.data?.message === 'string'
        ? e.data.message
        : Array.isArray(e.data?.message)
          ? e.data.message.join(' · ')
          : ''

    if (e.status === 409) {
      setDeleteBlockedMessage(message || 'This category is in use and cannot be deleted.')
      return
    }
    setDeleteError('Something went wrong. Please try again.')
  }

  // Pivot from delete-blocked (children) to edit on a specific child.
  function editChildFromBlockedModal(child: CategoryTreeNode) {
    setDeleteBlockedMessage(null)
    setDeleteError(null)
    setModal({ kind: 'edit', target: child })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-950">Platform categories</h1>
        <Button
          type="button"
          fullWidth={false}
          onClick={() => openCreate(null)}
        >
          + New category
        </Button>
      </header>

      <p className="text-sm text-zinc-500">
        Categories drive product discovery across YIIVA. Slugs are permanent —
        chosen carefully at creation. Renaming a category doesn&apos;t change its
        slug.
      </p>

      {isLoading ? (
        <InlineLoader />
      ) : isError ? (
        <ListErrorState />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <CategoryTree
            tree={tree ?? []}
            onAddChild={(parent) => openCreate(parent)}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        </div>
      )}

      {(modal.kind === 'create' || modal.kind === 'edit') && (
        <CategoryFormModal
          mode={
            modal.kind === 'create'
              ? { kind: 'create', defaultParent: modal.defaultParent }
              : { kind: 'edit', target: modal.target }
          }
          tree={tree ?? []}
          onCancel={closeModal}
          onSubmit={handleFormSubmit}
          loading={loading}
          error={formError}
        />
      )}

      {modal.kind === 'delete' && (
        <DeleteCategoryModal
          target={modal.target}
          onCancel={closeModal}
          onConfirm={handleDelete}
          blockedMessage={deleteBlockedMessage}
          loading={loading}
          error={deleteError}
          onEditChild={editChildFromBlockedModal}
        />
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// States
// ----------------------------------------------------------------------------

function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}

function ListErrorState() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <p className="text-sm text-zinc-600">
        Couldn&apos;t load categories. Refresh to try again.
      </p>
    </div>
  )
}
