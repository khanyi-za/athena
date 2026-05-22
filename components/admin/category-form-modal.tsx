'use client'

import { useEffect, useMemo, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  collectSelfAndDescendantIds,
  findNode,
  flattenForPicker,
} from '@/lib/category-tree-helpers'
import type { CategoryTreeNode } from '@/lib/schemas/category'

// Create + Edit share the same form (product-frontend-flows §10.2 / §10.3).
// Cycle prevention is enforced both client-side (picker options disabled) and
// server-side (backend 400). When editing, the target itself + its descendants
// are not selectable as a new parent.

type Mode =
  | { kind: 'create'; defaultParent: CategoryTreeNode | null }
  | { kind: 'edit'; target: CategoryTreeNode }

interface CategoryFormModalProps {
  mode: Mode
  tree: CategoryTreeNode[]
  onCancel: () => void
  onSubmit: (values: {
    name: string
    description?: string
    imageUrl?: string
    parentId: string | null
    sortOrder?: number
  }) => void
  loading: boolean
  error?: string | null
}

export function CategoryFormModal({
  mode,
  tree,
  onCancel,
  onSubmit,
  loading,
  error,
}: CategoryFormModalProps) {
  const isEdit = mode.kind === 'edit'

  // Initial values. For edit, hydrate from the target. For create with a
  // defaultParent, pre-select it.
  const [name, setName] = useState(isEdit ? mode.target.name : '')
  const [description, setDescription] = useState(
    isEdit ? (mode.target.description ?? '') : '',
  )
  const [imageUrl, setImageUrl] = useState(
    isEdit ? (mode.target.imageUrl ?? '') : '',
  )
  const [parentId, setParentId] = useState<string>(
    isEdit
      ? (mode.target.parentId ?? '')
      : (mode.kind === 'create' && mode.defaultParent ? mode.defaultParent.id : ''),
  )
  const [sortOrderInput, setSortOrderInput] = useState(
    isEdit ? String(mode.target.sortOrder) : '0',
  )

  const [nameError, setNameError] = useState<string | null>(null)
  const [sortOrderError, setSortOrderError] = useState<string | null>(null)

  // Disable target + descendants when editing — prevents cycles client-side.
  const blockedIds = useMemo(() => {
    if (!isEdit) return new Set<string>()
    const node = findNode(tree, mode.target.id)
    return node ? collectSelfAndDescendantIds(node) : new Set<string>()
  }, [tree, mode, isEdit])

  const pickerOptions = useMemo(() => flattenForPicker(tree), [tree])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError(null)
    setSortOrderError(null)

    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters.')
      return
    }
    if (trimmedName.length > 80) {
      setNameError('Name must be 80 characters or fewer.')
      return
    }

    const sortOrderNum = Number(sortOrderInput)
    if (!Number.isInteger(sortOrderNum) || sortOrderNum < 0) {
      setSortOrderError('Sort order must be a whole number ≥ 0.')
      return
    }

    const trimmedDescription = description.trim()
    const trimmedImageUrl = imageUrl.trim()

    onSubmit({
      name: trimmedName,
      description: trimmedDescription || undefined,
      imageUrl: trimmedImageUrl || undefined,
      parentId: parentId || null,
      sortOrder: sortOrderNum,
    })
  }

  const title = isEdit ? `Edit "${mode.target.name}"` : 'Create category'
  const submitLabel = isEdit ? 'Save changes' : 'Create category'

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        <h2 id="category-modal-title" className="text-lg font-semibold text-zinc-950">
          {title}
        </h2>

        {isEdit && (
          <p className="mt-2 text-xs text-zinc-500">
            The URL slug{' '}
            <span className="font-mono text-zinc-600">{mode.target.slug}</span>{' '}
            is permanent and won&apos;t change when you rename this category.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-4">
          <Input
            id="category-name"
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            error={nameError ?? undefined}
            placeholder="e.g. Hoodies"
            maxLength={80}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="category-description"
              className="text-sm font-medium text-zinc-700"
            >
              Description{' '}
              <span className="text-zinc-400">(optional)</span>
            </label>
            <textarea
              id="category-description"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          <Input
            id="category-image-url"
            label="Image URL (optional)"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={loading}
            placeholder="https://res.cloudinary.com/yiiva-dev/..."
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="category-parent"
              className="text-sm font-medium text-zinc-700"
            >
              Parent category{' '}
              <span className="text-zinc-400">(leave empty for root)</span>
            </label>
            <select
              id="category-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
            >
              <option value="">— No parent (root category)</option>
              {pickerOptions.map((opt) => {
                const disabled = blockedIds.has(opt.id)
                return (
                  <option key={opt.id} value={opt.id} disabled={disabled}>
                    {opt.label}
                    {disabled ? ' (cycle — not allowed)' : ''}
                  </option>
                )
              })}
            </select>
            {isEdit && (
              <p className="text-xs text-zinc-500">
                A category can&apos;t be moved under itself or its own descendants.
              </p>
            )}
          </div>

          <Input
            id="category-sort-order"
            label="Sort order"
            type="number"
            min={0}
            step={1}
            value={sortOrderInput}
            onChange={(e) => setSortOrderInput(e.target.value)}
            disabled={loading}
            error={sortOrderError ?? undefined}
          />
          <p className="-mt-3 text-xs text-zinc-500">
            Lower numbers appear first. Default 0.
          </p>
        </div>

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
          <Button type="submit" fullWidth={false} loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}
