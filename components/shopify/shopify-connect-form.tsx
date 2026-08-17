'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useConnectShopify } from '@/hooks/use-shopify'
import { shopifyErrorCode } from '@/lib/api/shopify'
import { connectShopifyInputSchema, type ShopifyConnection } from '@/lib/schemas/shopify'
import { CustomAppInstructions } from './custom-app-instructions'

// Shared by the onboarding flow and the settings section. The parent decides
// what happens after a successful connect (incl. the non-ZAR blocked case —
// the connection IS saved server-side either way).
//
// Auth model: Dev Dashboard app Client ID + Client secret. Nuwa validates
// them live (client-credentials exchange + shop query) before storing, and
// auto-refreshes the 24h access tokens from then on.

interface Props {
  onConnected: (view: ShopifyConnection) => void
  submitLabel?: string
}

export function ShopifyConnectForm({ onConnected, submitLabel = 'Connect my Shopify store' }: Props) {
  const connect = useConnectShopify()

  const [shopDomain, setShopDomain] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ shopDomain?: string; clientId?: string; clientSecret?: string }>({})
  const [bannerError, setBannerError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setBannerError(null)

    const parsed = connectShopifyInputSchema.safeParse({
      shopDomain,
      clientId,
      clientSecret,
    })
    if (!parsed.success) {
      const errs: typeof fieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof typeof errs
        if (field && !errs[field]) errs[field] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    connect.mutate(parsed.data, {
      onSuccess: onConnected,
      onError: (err) => {
        const code = shopifyErrorCode(err)
        const message = (err as Error).message
        if (code === 'INVALID_SHOP_DOMAIN' || code === 'SHOP_NOT_FOUND') {
          setFieldErrors({
            shopDomain:
              code === 'SHOP_NOT_FOUND'
                ? message
                : "Enter the store's myshopify.com domain (from your Shopify admin URL), not your public website domain.",
          })
        } else if (
          code === 'INVALID_SHOPIFY_CREDENTIALS' ||
          code === 'SHOPIFY_TOKEN_INVALID'
        ) {
          setFieldErrors({
            clientSecret:
              'Shopify rejected these credentials. Re-copy the Client ID and Client secret from your app’s Settings page, and make sure the app is installed on this store (Home → Install app).',
          })
        } else if (code === 'SHOP_ALREADY_CONNECTED') {
          setBannerError(
            'This Shopify store is already connected to a different YIIVA account. Contact support to resolve it.',
          )
        } else {
          setBannerError(message || 'Something went wrong. Please try again.')
        }
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <CustomAppInstructions />

      <Input
        id="shopify-domain"
        label="Shop domain"
        placeholder="yourstore.myshopify.com"
        value={shopDomain}
        onChange={(e) => setShopDomain(e.target.value)}
        error={fieldErrors.shopDomain}
        autoComplete="off"
        spellCheck={false}
      />

      <Input
        id="shopify-client-id"
        label="Client ID"
        placeholder="From your app’s Settings page on dev.shopify.com"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        error={fieldErrors.clientId}
        autoComplete="off"
        spellCheck={false}
      />

      <Input
        id="shopify-client-secret"
        label="Client secret"
        type="password"
        placeholder="Kept encrypted — used to authenticate with Shopify"
        value={clientSecret}
        onChange={(e) => setClientSecret(e.target.value)}
        error={fieldErrors.clientSecret}
        autoComplete="off"
        spellCheck={false}
      />

      {bannerError && <Alert variant="error">{bannerError}</Alert>}

      <Button type="submit" loading={connect.isPending}>
        {connect.isPending ? 'Checking your shop…' : submitLabel}
      </Button>
    </form>
  )
}
