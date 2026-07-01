'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

// App-wide theme infra (next-themes). Toggles a `.dark` class on <html>; the
// YIIVA token layer in globals.css defines the dark overrides. During the
// redesign migration we keep the app in light (no toggle surfaced globally yet)
// until enough screens speak tokens — dark ships with full coverage.
export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />
}
