'use client'

import { useEffect } from 'react'

// Centralized body scroll lock. Every modal in the app used to inline
//   useEffect(() => {
//     const previous = document.body.style.overflow
//     document.body.style.overflow = 'hidden'
//     return () => { document.body.style.overflow = previous }
//   }, [])
// which works for a single modal but leaks when modals overlap. If Modal A's
// effect captures `previous = ''` and locks to 'hidden', then Modal B mounts
// and captures `previous = 'hidden'`, B's cleanup restores to 'hidden' (not
// '') — and if the unmount order is wrong (route change mid-modal, async
// race, dev strict-mode double-mount), the body stays locked. Reload-only
// recovery, very annoying.
//
// This hook uses a single module-level counter. Only the first lock saves the
// original body overflow and applies 'hidden'; only the last release restores.
// Robust across stacked modals, route changes, and React 19's strict-mode
// effect double-invocation.

let lockCount = 0
let savedOverflow = ''

function acquire() {
  if (typeof document === 'undefined') return
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

function release() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow
    savedOverflow = ''
  }
}

/**
 * Locks `document.body` scroll for the lifetime of the calling component.
 * Safe to call from multiple modals at once — only the last one to unmount
 * restores the original overflow value.
 *
 * Pass `false` (or omit) when the modal isn't visible to keep the lock from
 * engaging. Lets callers preserve the `if (!open) return null` pattern at the
 * top of the render without surrounding it with a conditional hook call.
 */
export function useBodyScrollLock(active: boolean = true) {
  useEffect(() => {
    if (!active) return
    acquire()
    return () => {
      release()
    }
  }, [active])
}
