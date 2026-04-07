'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

export default function OnboardingPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  function handleShop() {
    // Flag this device so returning buyers skip this screen
    localStorage.setItem('yiiva_shopper', 'true')
    router.replace('/dashboard')
  }

  function handleSell() {
    router.replace('/dashboard')
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}.
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          What brings you to YIIVA? We&apos;ll get you to the right place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Shop card */}
        <button
          onClick={handleShop}
          className="group flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-zinc-950 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-950">
            <BagIcon className="text-zinc-600 transition-colors group-hover:text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-950">I want to shop</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Discover and buy from South Africa&apos;s best independent fashion and lifestyle brands.
            </p>
          </div>
          <span className="mt-auto text-sm font-medium text-zinc-950 group-hover:underline">
            Continue to shopping →
          </span>
        </button>

        {/* Sell card */}
        <button
          onClick={handleSell}
          className="group flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-zinc-950 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-950">
            <StoreIcon className="text-zinc-600 transition-colors group-hover:text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-950">I want to sell</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Set up your store and start selling your products to thousands of customers.
            </p>
          </div>
          <span className="mt-auto text-sm font-medium text-zinc-950 group-hover:underline">
            Set up my store →
          </span>
        </button>
      </div>
    </div>
  )
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </svg>
  )
}
