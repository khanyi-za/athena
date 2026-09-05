'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

// Appearance section — home of the theme preference since it left the shell
// chrome (2026-09-05). Device-local, not a store setting: next-themes persists
// to localStorage, nothing is saved to the backend.

const OPTIONS = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
] as const

export function AppearanceSection() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <section id="section-appearance" className="flex flex-col gap-6 scroll-mt-6">
      <header className="border-b border-border pb-3">
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How the dashboard looks on this device.
        </p>
      </header>

      <div className="flex gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          const selected = resolvedTheme === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={selected}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                selected
                  ? 'border-brand bg-brand-subtle text-brand'
                  : 'border-border text-muted-foreground hover:border-brand/50 hover:text-foreground',
              )}
            >
              <Icon size={16} />
              {opt.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
