'use client'

import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import { Alert } from '@/components/ui/alert'
import { MediaUploader } from '@/components/media-uploader'
import { BannerMediaItem } from '@/components/approved/banner-media-item'
import { DeleteBannerMediaModal } from '@/components/approved/delete-banner-media-modal'
import {
  AutosaveIndicator,
  type AutosaveState,
} from '@/components/ui/autosave-indicator'
import { addBannerMedia, reorderBannerMedia } from '@/lib/api/store'
import type { BannerMedia, StoreMe } from '@/lib/schemas/store'

// Multi-item banner gallery per store-frontend-flows.md §7.3a. Up to 5 items —
// any mix of images and videos. First item by sortOrder is the cover.
//
// What lives here:
//   - 5-slot grid (filled slots + dashed empty placeholders)
//   - Add image / Add video buttons with the 5-item cap enforced
//   - Drag-to-reorder via @dnd-kit (mobile-friendly, keyboard-accessible)
//   - Per-item delete with confirmation modal; last-item delete blocked on
//     PENDING_GO_LIVE / ACTIVE stores (backend also enforces; we pre-empt)
//
// Replaces the legacy single-image BannerSection used by ApprovedReadiness
// and the dashboard settings page.

const MAX_ITEMS = 5

interface BannerMediaSectionProps {
  store: StoreMe
  /** Fired after any successful add/remove/reorder so the parent can
   *  invalidate `useStoreMe` and re-render with fresh state. */
  onSavedRemote?: () => void
}

export function BannerMediaSection({ store, onSavedRemote }: BannerMediaSectionProps) {
  const [autosave, setAutosave] = useState<AutosaveState>({ state: 'idle' })
  // Optimistic-order override used during an in-flight drag. When null, we
  // render directly from store.bannerMedia (the source of truth). On drag
  // end, we set pendingOrder to the new array, fire the reorder API, then
  // clear it once the parent invalidates storeMe with the server-confirmed
  // order. This avoids a parent-prop-sync useEffect and the React 19
  // set-state-in-effect rule it would trigger.
  const [pendingOrder, setPendingOrder] = useState<BannerMedia[] | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BannerMedia | null>(null)

  const items = pendingOrder ?? store.bannerMedia

  const isFull = items.length >= MAX_ITEMS
  // For PENDING_GO_LIVE / ACTIVE stores, deleting the last remaining item
  // would break the readiness invariant. Surface the constraint up-front.
  const lastItemProtected =
    items.length === 1 &&
    (store.status === 'PENDING_GO_LIVE' || store.status === 'ACTIVE')

  // dnd-kit sensors — mouse/touch via PointerSensor (5px activation distance
  // so accidental clicks don't start a drag), keyboard for accessibility.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // --------------------------------------------------------------------------
  // Add
  // --------------------------------------------------------------------------

  async function handleAddUpload(
    secureUrl: string,
    mediaType: 'IMAGE' | 'VIDEO',
  ) {
    setAutosave({ state: 'saving' })
    try {
      await addBannerMedia(store.id, { url: secureUrl, mediaType })
      // Parent's onSavedRemote invalidates storeMe → fresh bannerMedia arrives.
      // Skip optimistic append to keep state model simple — the round-trip
      // is fast (single POST) and add is not a continuous interaction.
      setAutosave({ state: 'saved', savedAt: Date.now() })
      onSavedRemote?.()
    } catch {
      setAutosave({ state: 'error' })
    }
  }

  // --------------------------------------------------------------------------
  // Reorder
  // --------------------------------------------------------------------------

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(items, oldIndex, newIndex)
    // Optimistic UI: render the new order via pendingOrder while the API call
    // is in flight. Cleared once the parent's storeMe invalidate brings back
    // the server-confirmed order.
    setPendingOrder(next)
    setAutosave({ state: 'saving' })
    try {
      await reorderBannerMedia(store.id, { ids: next.map((i) => i.id) })
      setAutosave({ state: 'saved', savedAt: Date.now() })
      onSavedRemote?.()
      setPendingOrder(null)
    } catch {
      // Roll back to the server-truth view.
      setPendingOrder(null)
      setAutosave({ state: 'error' })
    }
  }

  // --------------------------------------------------------------------------
  // Delete
  // --------------------------------------------------------------------------

  function openDelete(item: BannerMedia) {
    setDeleteTarget(item)
  }

  function closeDelete() {
    setDeleteTarget(null)
  }

  function handleDeleteSuccess() {
    setDeleteTarget(null)
    setAutosave({ state: 'saved', savedAt: Date.now() })
    // Parent invalidates storeMe → bannerMedia refreshes without the deleted
    // item. No local optimism needed — DELETE is a single round-trip.
    onSavedRemote?.()
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const emptySlotCount = MAX_ITEMS - items.length

  return (
    <section
      id="section-banner"
      className="scroll-mt-6 rounded-xl border border-border bg-card p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Banner media</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Up to {MAX_ITEMS} images or videos. The first one is your cover.
            Drag to reorder.
          </p>
        </div>
        <AutosaveIndicator autosave={autosave} />
      </header>

      <div className="mt-6 flex flex-col gap-4">
        {items.length === 0 ? (
          <EmptyState
            storeId={store.id}
            onUploaded={handleAddUpload}
            onError={() => setAutosave({ state: 'error' })}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={rectSortingStrategy}
            >
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {items.map((item) => (
                  <BannerMediaItem
                    key={item.id}
                    item={item}
                    deleteDisabled={lastItemProtected}
                    deleteDisabledReason={
                      lastItemProtected
                        ? "Add a replacement first — your store can't be live without a banner."
                        : undefined
                    }
                    onDelete={openDelete}
                  />
                ))}
                {Array.from({ length: emptySlotCount }).map((_, i) => (
                  <li
                    key={`empty-${i}`}
                    aria-hidden
                    className="aspect-square rounded-lg border border-dashed border-border bg-muted/50"
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {items.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {items.length} of {MAX_ITEMS} items.
            {lastItemProtected &&
              ' Live stores need at least one banner — add a replacement before removing the last item.'}
          </p>
        )}

        {/* Add controls — separate buttons for image vs video so the picker
            applies the right Cloudinary preset constraints. */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <MediaUploader
            purpose="store_banner"
            storeId={store.id}
            disabled={isFull}
            label="+ Add image"
            onUploaded={(url) => void handleAddUpload(url, 'IMAGE')}
            onError={() => setAutosave({ state: 'error' })}
          />
          <MediaUploader
            purpose="store_banner_video"
            storeId={store.id}
            disabled={isFull}
            label="+ Add video"
            onUploaded={(url) => void handleAddUpload(url, 'VIDEO')}
            onError={() => setAutosave({ state: 'error' })}
          />
          {isFull && (
            <p className="text-xs text-muted-foreground">
              Banner is full — remove an item to add another.
            </p>
          )}
        </div>

        {autosave.state === 'error' && (
          <Alert variant="error">
            Banner update failed. Refresh the page and try again.
          </Alert>
        )}
      </div>

      {deleteTarget && (
        <DeleteBannerMediaModal
          storeId={store.id}
          item={deleteTarget}
          preventLastDelete={lastItemProtected}
          onClose={closeDelete}
          onSuccess={handleDeleteSuccess}
          onAddInstead={() => {
            closeDelete()
            const el = document.getElementById('section-banner')
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      )}
    </section>
  )
}

// ----------------------------------------------------------------------------
// Empty state — first-time banner setup. Big, inviting; both Add CTAs prominent.
// ----------------------------------------------------------------------------

function EmptyState({
  storeId,
  onUploaded,
  onError,
}: {
  storeId: string
  onUploaded: (url: string, mediaType: 'IMAGE' | 'VIDEO') => void
  onError: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted p-12 text-center">
      <h3 className="text-base font-semibold text-foreground">Add your first banner</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Up to {MAX_ITEMS} images or videos. The first one becomes your store&apos;s
        cover.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <MediaUploader
          purpose="store_banner"
          storeId={storeId}
          label="+ Add image"
          onUploaded={(url) => onUploaded(url, 'IMAGE')}
          onError={onError}
        />
        <MediaUploader
          purpose="store_banner_video"
          storeId={storeId}
          label="+ Add video"
          onUploaded={(url) => onUploaded(url, 'VIDEO')}
          onError={onError}
        />
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

