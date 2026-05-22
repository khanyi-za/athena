import { formatZAR } from '@/lib/format-money'
import type { Product } from '@/lib/schemas/product'

// Form values for the product editor's Basics section. All values are strings
// for RHF — numeric fields (price, comparePrice, totalStock) are formatted for
// display and parsed back at autosave time.
//
// Same pattern as the store wizard's WizardFormValues, just product-shaped.

export interface ProductEditorFormValues {
  title: string
  description: string
  sku: string
  priceInput: string
  comparePriceInput: string
  totalStockInput: string
}

export function productToFormValues(product: Product): ProductEditorFormValues {
  return {
    title: product.title,
    description: product.description ?? '',
    sku: product.sku ?? '',
    priceInput: formatPriceForInput(product.priceInCents),
    comparePriceInput:
      product.comparePriceInCents !== null
        ? formatPriceForInput(product.comparePriceInCents)
        : '',
    totalStockInput: String(product.totalStock),
  }
}

// Strip the "R " prefix from formatZAR for use inside an input that already
// shows the R as adornment.
export function formatPriceForInput(cents: number): string {
  return formatZAR(cents).replace('R ', '')
}
