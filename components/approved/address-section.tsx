'use client'

import type { StoreAddress, StoreMe } from '@/lib/schemas/store'

// Address management section for the APPROVED dashboard. Pure presentation —
// the parent owns modal state, this just renders the list and surfaces
// add/edit/delete intents via callbacks.

interface AddressSectionProps {
  store: StoreMe
  onAdd: () => void
  onEdit: (address: StoreAddress) => void
  onDelete: (address: StoreAddress) => void
}

export function AddressSection({ store, onAdd, onEdit, onDelete }: AddressSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Locations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Where your brand is based. Shown on your store profile.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
        >
          + Add location
        </button>
      </header>

      {store.addresses.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-muted p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No locations yet. Add at least one before requesting go-live.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Add your first location
          </button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {store.addresses.map((address) => (
            <li key={address.id}>
              <AddressCard
                address={address}
                onEdit={() => onEdit(address)}
                onDelete={() => onDelete(address)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: StoreAddress
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
      <div className="text-sm">
        <p className="font-medium text-foreground">
          {address.streetNumber} {address.streetName}
          {address.buildingName ? `, ${address.buildingName}` : ''}
        </p>
        <p className="text-muted-foreground">
          {address.suburb ? `${address.suburb}, ` : ''}
          {address.city}, {address.postalCode}
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={onEdit}
          className="font-medium text-foreground transition-colors hover:text-foreground"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="font-medium text-muted-foreground transition-colors hover:text-danger"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
