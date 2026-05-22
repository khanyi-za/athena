import { apiFetch } from '@/lib/api-client'
import {
  categoryTreeResponseSchema,
  categoryWithParentSchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
  type CategoryTreeNode,
  type CategoryWithParent,
  type CreateCategoryBody,
  type UpdateCategoryBody,
} from '@/lib/schemas/category'

// Public read of the platform-category tree (anyone) + admin CRUD (ADMIN role).
// Backend gates the mutation endpoints via RolesGuard; frontend access control
// is at the admin route segment.

/**
 * Get the full platform-category tree. Public — no auth required.
 */
export async function getPlatformCategories(): Promise<CategoryTreeNode[]> {
  const data = await apiFetch<unknown>('/api/categories', { method: 'GET' })
  return categoryTreeResponseSchema.parse(data)
}

/**
 * POST /categories — admin only. Backend auto-generates the slug from the name.
 */
export async function createCategory(body: CreateCategoryBody): Promise<CategoryWithParent> {
  const validated = createCategoryBodySchema.parse(body)
  const data = await apiFetch<unknown>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return categoryWithParentSchema.parse(data)
}

/**
 * PATCH /categories/:id — admin only.
 *
 * `parentId` can be set to null to make a category a root. Backend prevents
 * cycles; frontend should pre-disable cycle-creating options in the parent
 * picker for a smoother UX (backend rejects with 400 either way).
 *
 * Slug is NOT regenerated when the name changes — it's fixed at creation.
 */
export async function updateCategory(
  id: string,
  body: UpdateCategoryBody,
): Promise<CategoryWithParent> {
  const validated = updateCategoryBodySchema.parse(body)
  const data = await apiFetch<unknown>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(validated),
  })
  return categoryWithParentSchema.parse(data)
}

/**
 * DELETE /categories/:id — admin only. Blocked with 409 when the category has
 * children, linked products, or store associations — each fires a distinct
 * message. Callers surface specific recovery copy per blocked-by reason.
 */
export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/categories/${id}`, {
    method: 'DELETE',
  })
}
