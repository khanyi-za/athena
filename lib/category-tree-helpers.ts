import type { CategoryTreeNode } from '@/lib/schemas/category'

// Pure helpers over the platform-category tree. Used by the admin tree page +
// parent-picker (cycle prevention) per product-frontend-flows §10.3.

export function findNode(
  tree: CategoryTreeNode[],
  id: string,
): CategoryTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    const inChild = findNode(node.children, id)
    if (inChild) return inChild
  }
  return null
}

/**
 * Collect a node's id plus all descendant ids. Used by the parent picker to
 * disable cycle-creating options when editing a category — a category cannot
 * be reparented under itself or any of its descendants.
 */
export function collectSelfAndDescendantIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>()
  function walk(n: CategoryTreeNode) {
    ids.add(n.id)
    n.children.forEach(walk)
  }
  walk(node)
  return ids
}

export interface FlatPickerOption {
  id: string
  name: string
  depth: number
  /** Indented label (em-dash per level) for use in a <select>'s text. */
  label: string
}

/**
 * Flatten the tree into a depth-ordered list suitable for a <select> picker.
 * Indented with "— " per level so the hierarchy is visually obvious in a flat
 * dropdown. Root nodes have depth 0.
 */
export function flattenForPicker(tree: CategoryTreeNode[]): FlatPickerOption[] {
  const out: FlatPickerOption[] = []
  function walk(nodes: CategoryTreeNode[], depth: number) {
    for (const n of nodes) {
      out.push({
        id: n.id,
        name: n.name,
        depth,
        label: `${'— '.repeat(depth)}${n.name}`,
      })
      walk(n.children, depth + 1)
    }
  }
  walk(tree, 0)
  return out
}
