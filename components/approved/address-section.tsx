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
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Locations</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Where your brand is based. Shown on your store profile.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-zinc-950 underline-offset-2 hover:underline"
        >
          + Add location
        </button>
      </header>

      {store.addresses.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-600">
            No locations yet. Add at least one before requesting go-live.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4">
      <div className="text-sm">
        <p className="font-medium text-zinc-950">
          {address.streetNumber} {address.streetName}
          {address.buildingName ? `, ${address.buildingName}` : ''}
        </p>
        <p className="text-zinc-500">
          {address.suburb ? `${address.suburb}, ` : ''}
          {address.city}, {address.postalCode}
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={onEdit}
          className="font-medium text-zinc-700 transition-colors hover:text-zinc-950"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="font-medium text-zinc-500 transition-colors hover:text-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
