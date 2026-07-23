import { apiFetch } from '@/lib/api-client'
import {
  shopifyConnectionSchema,
  shopifyImportJobSchema,
  shopifyImportPreviewSchema,
  type ConnectShopifyInput,
  type ShopifyConnection,
  type ShopifyImportJob,
  type ShopifyImportPreview,
  type StartImportInput,
} from '@/lib/schemas/shopify'
import { z } from 'zod'

// Shopify onboarding — all USER-scoped (no storeId; the import may create
// the store). 404s on the GETs are data ("not connected" / "no imports"),
// not errors — mapped to null so queries hold them as state.

/** Machine error code from a nuwa `{ code, message }` error body, if any. */
export function shopifyErrorCode(err: unknown): string | undefined {
  const data = (err as { data?: { code?: unknown } } | undefined)?.data
  return typeof data?.code === 'string' ? data.code : undefined
}

function isStatus(err: unknown, status: number): boolean {
  return (err as { status?: number } | undefined)?.status === status
}

export async function getShopifyConnection(): Promise<ShopifyConnection | null> {
  try {
    const data = await apiFetch<unknown>('/api/shopify/connection')
    return shopifyConnectionSchema.parse(data)
  } catch (err) {
    if (isStatus(err, 404)) return null
    throw err
  }
}

/**
 * Validate the token live against the shop and store it (encrypted, nuwa
 * side). Reconnecting the same shop for the same user updates the token in
 * place — "Update token" reuses this call.
 */
export async function connectShopify(
  input: ConnectShopifyInput,
): Promise<ShopifyConnection> {
  const data = await apiFetch<unknown>('/api/shopify/connection', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return shopifyConnectionSchema.parse(data)
}

export async function disconnectShopify(): Promise<{ disconnected: boolean }> {
  const data = await apiFetch<unknown>('/api/shopify/connection', {
    method: 'DELETE',
  })
  return z.object({ disconnected: z.boolean() }).parse(data)
}

/**
 * Read-only pull + map of the whole catalogue — what an import WOULD bring
 * across. Slow on large shops (seconds); callers own the long-load UX.
 */
export async function getShopifyImportPreview(): Promise<ShopifyImportPreview> {
  const data = await apiFetch<unknown>('/api/shopify/import/preview')
  return shopifyImportPreviewSchema.parse(data)
}

export async function startShopifyImport(
  input: StartImportInput,
): Promise<ShopifyImportJob> {
  const data = await apiFetch<unknown>('/api/shopify/import', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return shopifyImportJobSchema.parse(data)
}

export async function getLatestShopifyImport(): Promise<ShopifyImportJob | null> {
  try {
    const data = await apiFetch<unknown>('/api/shopify/import/latest')
    return shopifyImportJobSchema.parse(data)
  } catch (err) {
    if (isStatus(err, 404)) return null
    throw err
  }
}
