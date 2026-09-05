'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

// Dark/light toggle (YIIVA redesign finale). next-themes toggles the `.dark`
// class on <html>; the whole app is token-driven so it flips cleanly. No mounted
// guard needed — with enableSystem=false + defaultTheme=dark (default flipped
// 2026-09-05), server and first client render agree (Sun), and next-themes'
// pre-hydration script + the suppressHydrationWarning on <html> handle the
// class swap. Still used by the admin/onboarding/thin-topbar chromes; the
// merchant AppShell now routes theme through Settings → Appearance instead.

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
