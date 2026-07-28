'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Step-by-step guide for creating the Shopify custom app that produces the
// Admin API token the connect form asks for. Collapsible so returning users
// aren't buried in instructions.

const STEPS: React.ReactNode[] = [
  <>
    In your Shopify admin, go to <strong>Settings → Apps and sales channels →
    Develop apps</strong>. If prompted, choose{' '}
    <strong>Allow custom app development</strong>.
  </>,
  <>
    Click <strong>Create an app</strong>, name it &ldquo;YIIVA&rdquo; and
    create it.
  </>,
  <>
    Open <strong>Configuration → Admin API integration → Configure</strong>{' '}
    and tick these scopes: <code>read_products</code>,{' '}
    <code>read_inventory</code>, <code>read_locations</code>,{' '}
    <code>read_legal_policies</code> (shows your own returns policy on your
    YIIVA product pages) and{' '}
    <code>write_inventory</code> (lets YIIVA reduce your Shopify stock when
    something sells here). Save.
  </>,
  <>
    Go to <strong>API credentials → Install app</strong> and confirm.
  </>,
  <>
    Under <strong>Admin API access token</strong>, click{' '}
    <strong>Reveal token once</strong> and copy it — it starts with{' '}
    <code>shpat_</code> and Shopify shows it only one time.
  </>,
  <>
    Recommended: also copy the <strong>API secret key</strong> on the same
    screen — it lets YIIVA verify stock updates coming from Shopify.
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
        Where do I get these details? (about 3 minutes, inside your Shopify
        admin)
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
