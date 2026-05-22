'use client'

import { useState } from 'react'

import { useInvalidateProduct } from '@/hooks/use-product'
import { usePlatformCategories } from '@/hooks/use-platform-categories'
import type { CategoryTreeNode } from '@/lib/schemas/category'
import type { Product } from '@/lib/schemas/product'

import { CategoryPickerModal } from '@/components/products/category-picker-modal'
import { DeleteCategoryLinkModal } from '@/components/products/delete-category-link-modal'

// Categories section — chip list of linked categories + "Add category" CTA.
// Required for activation (≥1 platform category).

interface CategoriesSectionProps {
  storeId: string
  product: Product
}

interface LinkedCategory {
  id: string
  path: string
}

export function CategoriesSection({ storeId, product }: CategoriesSectionProps) {
  const invalidateProduct = useInvalidateProduct()
  const { data: tree } = usePlatformCategories()
  const isArchived = product.status === 'ARCHIVED'

  const [pickerOpen, setPickerOpen] = useState(false)
  const [deleting, setDeleting] = useState<LinkedCategory | null>(null)

  // Resolve breadcrumb paths for the linked categories by walking the tree.
  // Falls back to the linked category's own name when the tree isn't loaded
  // yet — buyers see the same name regardless.
  const linkedCategories: LinkedCategory[] = product.categories.map((entry) => {
    const path = tree ? findCategoryPath(tree, entry.category.id) : null
    return { id: entry.category.id, path: path ?? entry.category.name }
  })

  const linkedIds = new Set(product.categories.map((entry) => entry.category.id))

  function isOnlyCategoryOnActive(categoryId: string): boolean {
    if (product.status !== 'ACTIVE') return false
    return (
      product.categories.length === 1 &&
      product.categories[0].category.id === categoryId
    )
  }

  function handleDeleteSuccess() {
    invalidateProduct(storeId, product.id)
    setDeleting(null)
  }

  return (
    <section id="section-categories" className="scroll-mt-6 flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-lg font-semibold text-zinc-950">Categories</h2>
        {!isArchived && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-sm font-medium text-zinc-950 underline-offset-2 hover:underline"
          >
            + Add category
          </button>
        )}
      </header>

      {linkedCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-600">
            No categories yet. At least one is required to activate this product.
          </p>
          {!isArchived && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              + Add a category
            </button>
          )}
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {linkedCategories.map((cat) => (
            <li key={cat.id}>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm">
                <span className="text-zinc-950">{cat.path}</span>
                {!isArchived && (
                  <button
                    type="button"
                    onClick={() => setDeleting(cat)}
                    aria-label={`Remove ${cat.path}`}
                    className="ml-1 text-zinc-400 transition-colors hover:text-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pickerOpen && (
        <CategoryPickerModal
          storeId={storeId}
          productId={product.id}
          linkedCategoryIds={linkedIds}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {deleting && (
        <DeleteCategoryLinkModal
          storeId={storeId}
          productId={product.id}
          categoryId={deleting.id}
          categoryPath={deleting.path}
          preventLastDelete={isOnlyCategoryOnActive(deleting.id)}
          onClose={() => setDeleting(null)}
          onSuccess={handleDeleteSuccess}
          onAddInstead={() => {
            setDeleting(null)
            setPickerOpen(true)
          }}
        />
      )}
    </section>
  )
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function findCategoryPath(
  nodes: CategoryTreeNode[],
  targetId: string,
  pathPrefix = '',
): string | null {
  for (const node of nodes) {
    const path = pathPrefix ? `${pathPrefix} / ${node.name}` : node.name
    if (node.id === targetId) return path
    if (node.children.length > 0) {
      const inChild = findCategoryPath(node.children, targetId, path)
      if (inChild) return inChild
    }
  }
  return null
}
