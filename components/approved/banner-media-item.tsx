'use client'

import { CldImage } from 'next-cloudinary'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import {
  SQUARE_THUMB_500_RECIPE,
  videoFrameAtSecond,
} from '@/lib/cloudinary-transforms'
import type { BannerMedia } from '@/lib/schemas/store'

// A single slot in the banner gallery. Wrapped in @dnd-kit's useSortable so it
// can be dragged to reorder; the whole tile is the drag handle (mobile-friendly).
//
// Cover label appears on the item with isPrimary: true (the lowest sortOrder).
// Delete button is disabled when deleteDisabled is true (the parent handles
// the "last item on ACTIVE/PENDING_GO_LIVE" guard).

interface BannerMediaItemProps {
  item: BannerMedia
  deleteDisabled: boolean
  deleteDisabledReason?: string
  onDelete: (item: BannerMedia) => void
}

export function BannerMediaItem({
  item,
  deleteDisabled,
  deleteDisabledReason,
  onDelete,
}: BannerMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lift while dragging so the row clearly separates from its slot.
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.9 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        'relative aspect-square select-none overflow-hidden rounded-lg border bg-muted',
        isDragging ? 'border-brand shadow-lg' : 'border-border',
      ].join(' ')}
      {...attributes}
      {...listeners}
    >
      {/* Media thumbnail */}
      {item.mediaType === 'VIDEO' ? (
        <CldImage
          src={item.url}
          // assetType="video" tells next-cloudinary the src is a video asset
          // so it builds the frame-extraction URL (otherwise CldImage tries
          // to fetch the .mp4 as an image and Cloudinary returns 404).
          assetType="video"
          {...videoFrameAtSecond(2, 500, 500)}
          alt="Banner video frame"
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <CldImage
          src={item.url}
          {...SQUARE_THUMB_500_RECIPE}
          alt="Banner image"
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      {/* Type badges + cover label */}
      <div className="pointer-events-none absolute inset-x-1 top-1 flex items-start justify-between gap-1">
        {item.isPrimary ? (
          <span className="rounded bg-zinc-950 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
            COVER
          </span>
        ) : (
          <span />
        )}
        {item.mediaType === 'VIDEO' && (
          <span className="rounded-full bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            ▶
          </span>
        )}
      </div>

      {/* Delete button — pointer-events lifted above the drag listeners by
          stopping propagation in the handler. */}
      <button
        type="button"
        aria-label="Remove banner item"
        title={deleteDisabled ? deleteDisabledReason : 'Remove'}
        disabled={deleteDisabled}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          if (!deleteDisabled) onDelete(item)
        }}
        className={[
          'absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-sm font-semibold shadow-sm transition-colors',
          deleteDisabled
            ? 'cursor-not-allowed text-muted-foreground'
            : 'text-foreground hover:bg-card hover:text-danger',
        ].join(' ')}
      >
        ×
      </button>
    </li>
  )
}
