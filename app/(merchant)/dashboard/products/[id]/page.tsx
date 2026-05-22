'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/store/auth-store'
import { useStoreMe } from '@/hooks/use-store-me'
import { ProductEditorShell } from '@/components/products/product-editor-shell'

interface ProductEditorPageProps {
  params: Promise<{ id: string }>
}

export default function ProductEditorPage({ params }: ProductEditorPageProps) {
  // Next.js 16 — params is a Promise. `use()` unwraps it client-side.
  const { id: productId } = use(params)

  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const { data: store } = useStoreMe()

  // Access gate: MERCHANTs with APPROVED+ stores only.
  useEffect(() => {
    if (isInitializing || !user) return
    if (user.role !== 'MERCHANT') {
      router.replace('/dashboard')
      return
    }
    const status = user.store?.status
    if (status !== 'APPROVED' && status !== 'PENDING_GO_LIVE' && status !== 'ACTIVE') {
      router.replace('/dashboard')
    }
  }, [isInitializing, user, router])

  if (isInitializing || !user || user.role !== 'MERCHANT' || !store) {
    return <InlineLoader />
  }

  return <ProductEditorShell storeId={store.id} productId={productId} />
}

function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}
