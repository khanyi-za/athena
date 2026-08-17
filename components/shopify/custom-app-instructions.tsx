'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Step-by-step guide for creating the Shopify Dev Dashboard app that
// produces the Client ID + Client secret the connect form asks for.
// (Shopify retired in-admin custom apps on 2026-01-01 — apps now live at
// dev.shopify.com and are configured as released versions.)
// Collapsible so returning users aren't buried in instructions.

const STEPS: React.ReactNode[] = [
  <>
    Go to <strong>dev.shopify.com/dashboard</strong> and sign in with the same
    account you use for your Shopify store. With <strong>Apps</strong> selected
    in the left panel, click <strong>Create app</strong> →{' '}
    <strong>Start from Dev Dashboard</strong>, name it &ldquo;YIIVA&rdquo; and
    create it.
  </>,
  <>
    Open the <strong>Versions</strong> tab and create a version. Untick{' '}
    <strong>Embed app in Shopify admin</strong>, and set <strong>App URL</strong>{' '}
    to <code>https://shopify.dev/apps/default-app-home</code> (Shopify&apos;s
    placeholder for apps without their own page).
  </>,
  <>
    Under <strong>Required scopes</strong>, click <strong>Select scopes</strong>{' '}
    (the list is long — use its search box) and tick:{' '}
    <code>read_products</code>, <code>read_inventory</code>,{' '}
    <code>read_locations</code>, <code>read_legal_policies</code> (shows your
    own returns policy on your YIIVA product pages) and{' '}
    <code>write_inventory</code> (lets YIIVA reduce your Shopify stock when
    something sells here). Leave &ldquo;Use legacy install flow&rdquo;
    unticked and Redirect URLs empty.
  </>,
  <>
    Click <strong>Release</strong> (top-right) to publish the version.
  </>,
  <>
    Go to the app&apos;s <strong>Home</strong> tab, scroll down, click{' '}
    <strong>Install app</strong>, choose your store and confirm.
  </>,
  <>
    Open the app&apos;s <strong>Settings</strong> tab and copy the{' '}
    <strong>Client ID</strong> and <strong>Client secret</strong> into the form
    below. Keep the secret private — treat it like a password.
  </>,
  <>
    Your shop domain is the <code>something.myshopify.com</code> address in
    your admin URL bar — not your public website domain.
  </>,
]

export function CustomAppInstructions() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-muted/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground"
      >
        Where do I get these details? (about 5 minutes, at dev.shopify.com)
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <ol className="flex list-decimal flex-col gap-2 px-4 pb-4 pl-9 text-sm leading-relaxed text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-foreground [&_strong]:text-foreground">
          {STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  )
}
