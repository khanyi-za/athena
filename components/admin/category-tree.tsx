'use client'

import { useState } from 'react'

import type { CategoryTreeNode } from '@/lib/schemas/category'

// Recursive tree renderer per product-frontend-flows §10.1. Each node renders
// chevron + name + actions ([+ Add child] [Edit] [×]). Children render
// indented under their parent. Per-node product counts shown when the backend
// surfaces _count (currently absent from the public tree; rendered gracefully
// regardless).

interface CategoryTreeProps {
  tree: CategoryTreeNode[]
  onAddChild: (parent: CategoryTreeNode) => void
  onEdit: (node: CategoryTreeNode) => void
  onDelete: (node: CategoryTreeNode) => void
}

export function CategoryTree({
  tree,
  onAddChild,
  onEdit,
  onDelete,
}: CategoryTreeProps) {
  if (tree.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted p-12 text-center">
        <h2 className="text-base font-semibold text-foreground">
          No categories yet
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Create the first category to start building the platform taxonomy.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {tree.map((node) => (
        <CategoryTreeNodeRow
          key={node.id}
          node={node}
          depth={0}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

function CategoryTreeNodeRow({
  node,
  depth,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: CategoryTreeNode
  depth: number
  onAddChild: (parent: CategoryTreeNode) => void
  onEdit: (node: CategoryTreeNode) => void
  onDelete: (node: CategoryTreeNode) => void
}) {
  // Top-level open by default; deeper levels collapsed to keep the surface
  // skimmable. Local state — the admin can expand/collapse as they work.
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = node.children.length > 0

  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        {/* Chevron — invisible placeholder when leaf so labels stay aligned */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"
          >
            <span
              aria-hidden
              className={['text-xs transition-transform', open ? 'rotate-90' : ''].join(
                ' ',
              )}
            >
              ▶
            </span>
          </button>
        ) : (
          <span aria-hidden className="h-5 w-5 flex-shrink-0" />
        )}

        <span className="flex-1 truncate text-sm text-foreground">
          {node.name}
          <span className="ml-2 font-mono text-xs text-muted-foreground">{node.slug}</span>
        </span>

        <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onAddChild(node)}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            + Add child
          </button>
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            aria-label={`Delete ${node.name}`}
            className="rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger/5"
          >
            ×
          </button>
        </div>
      </div>

      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <CategoryTreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
