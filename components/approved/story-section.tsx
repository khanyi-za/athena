'use client'

import { useState } from 'react'
import {
  AutosaveIndicator,
  type AutosaveState,
} from '@/components/ui/autosave-indicator'
import { useAutosaveField } from '@/components/wizard/use-autosave-field'
import type { Store, StoreMe } from '@/lib/schemas/store'

// Brand story editor for the APPROVED dashboard. Required for go-live.
// Reuses the wizard's useAutosaveField hook with 800ms debounce — same UX as
// the story textarea in the DRAFT wizard.

interface StorySectionProps {
  store: StoreMe
  onSavedRemote?: (store: Store) => void
}

const MAX_LENGTH = 2000

export function StorySection({ store, onSavedRemote }: StorySectionProps) {
  const [autosave, setAutosave] = useState<AutosaveState>({ state: 'idle' })
  const [story, setStory] = useState<string>(store.story ?? '')

  useAutosaveField({
    storeId: store.id,
    fieldName: 'story',
    value: story,
    initialValue: store.story,
    debounceMs: 800,
    setState: setAutosave,
    onSaved: onSavedRemote,
  })

  return (
    <section
      id="section-story"
      className="scroll-mt-6 rounded-xl border border-zinc-200 bg-white p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Brand story</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Tell buyers about your journey, what you stand for, what makes your brand
            special. Required for go-live.
          </p>
        </div>
        <AutosaveIndicator autosave={autosave} />
      </header>

      <div className="mt-6 flex flex-col gap-1.5">
        <div className="flex items-center justify-end">
          <span className="text-xs text-zinc-400">
            {story.length} / {MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="story"
          rows={8}
          maxLength={MAX_LENGTH}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Where you started, what you stand for, what makes you different…"
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
        />
      </div>
    </section>
  )
}
