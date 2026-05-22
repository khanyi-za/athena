'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { usePlatformCategories } from '@/hooks/use-platform-categories'
import { useInvalidateProduct } from '@/hooks/use-product'
import { linkProductCategory } from '@/lib/api/products'
import type { CategoryTreeNode } from '@/lib/schemas/category'

// Category picker — flat list of platform categories with breadcrumb paths +
// search filter. Click-to-link semantics: each click immediately POSTs and the
// row flips to ✓. Modal stays open so the merchant can add multiple. "Done"
// closes it.
//
// A tree-style expand/collapse picker is in the spec but deferred to M6 polish.
// Flat-with-paths covers the same use case with simpler interaction.

interface CategoryPickerModalProps {
  storeId: string
  productId: string
  linkedCategoryIds: Set<string>
  onClose: () => void
}

interface FlatCategory {
  id: string
  name: string
  path: string
}

export function CategoryPickerModal({
  storeId,
  productId,
  linkedCategoryIds,
  onClose,
}: CategoryPickerModalProps) {
  const { data: tree, isLoading, isError } = usePlatformCategories()
  const invalidateProduct = useInvalidateProduct()

  const [search, setSearch] = useState('')
  const [linking, setLinking] = useState<string | null>(null)
  // Track locally-just-added IDs so the row flips to ✓ before /stores/me refetches.
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !linking) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [linking, onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const flatCategories = useMemo(() => (tree ? flattenCategories(tree) : []), [tree])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return flatCategories
    return flatCategories.filter((c) => c.path.toLowerCase().includes(term))
  }, [flatCategories, search])

  async function handleLink(categoryId: string) {
    if (linking) return
    setLinking(categoryId)
    setError(null)
    try {
      await linkProductCategory(storeId, productId, categoryId)
      setJustAdded((prev) => new Set(prev).add(categoryId))
      invalidateProduct(storeId, productId)
    } catch {
      setError('Couldn’t add that category. Try again.')
    } finally {
      setLinking(null)
    }
  }

  function isLinked(id: string): boolean {
    return linkedCategoryIds.has(id) || justAdded.has(id)
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="category-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={() => {
        if (!linking) onClose()
      }}
    >
      <div
        className="relative flex w-full max-w-lg flex-col gap-4 rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="category-picker-title" className="text-lg font-semibold text-zinc-950">
          Add category
        </h2>
        <p className="text-sm text-zinc-500">
          Pick the most specific category. Buyers can find your product through any
          parent category too.
        </p>

        <input
          type="search"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
        />

        {error && <Alert variant="error">{error}</Alert>}

        <div className="max-h-80 overflow-y-auto rounded-lg border border-zinc-200">
          {isLoading ? (
            <PickerLoading />
          ) : isError ? (
            <PickerError />
          ) : filtered.length === 0 ? (
            <PickerEmpty filtered={!!search} />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {filtered.map((cat) => {
                const linked = isLinked(cat.id)
                const isBusy = linking === cat.id
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => handleLink(cat.id)}
                      disabled={linked || isBusy}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed"
                    >
                      <span className={linked ? 'text-zinc-500' : 'text-zinc-950'}>
                        {cat.path}
                      </span>
                      {linked ? (
                        <span className="text-xs font-medium text-emerald-700">✓ Added</span>
                      ) : isBusy ? (
                        <span className="text-xs text-zinc-500">Adding…</span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-700">+ Add</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" fullWidth={false} onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function flattenCategories(
  nodes: CategoryTreeNode[],
  pathPrefix = '',
): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const node of nodes) {
    const path = pathPrefix ? `${pathPrefix} / ${node.name}` : node.name
    result.push({ id: node.id, name: node.name, path })
    if (node.children.length > 0) {
      result.push(...flattenCategories(node.children, path))
    }
  }
  return result
}

function PickerLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        aria-hidden
        className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}

function PickerError() {
  return (
    <div className="px-3 py-6 text-center text-sm text-zinc-500">
      Couldn&apos;t load categories. Close this dialog and try again.
    </div>
  )
}

function PickerEmpty({ filtered }: { filtered: boolean }) {
  return (
    <div className="px-3 py-6 text-center text-sm text-zinc-500">
      {filtered ? 'No categories match your search.' : 'No categories available yet.'}
    </div>
  )
}
