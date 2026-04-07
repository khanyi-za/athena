'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import type { User } from '@/types/auth'

export default function DashboardPage() {
  const { user, isInitializing } = useAuthStore()

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </div>
    )
  }

  if (!user) return null

  // Full dashboard — approved merchant, admin, or active store
  if (user.role === 'MERCHANT' || user.role === 'ADMIN' || user.store?.status === 'ACTIVE') {
    return <MerchantView user={user} />
  }

  if (user.store?.status === 'PENDING_REVIEW') return <PendingReviewView />
  if (user.store?.status === 'DRAFT') return <DraftView />
  if (user.store?.status === 'SUSPENDED') return <SuspendedView />
  if (user.store?.status === 'CLOSED') return <ClosedView />

  // BUYER with no store — web landing
  return <BuyerLandingView user={user} />
}

function MerchantView({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-zinc-950">
        Welcome back, {user.firstName}.
      </h1>
      <p className="text-sm text-zinc-500">Here&apos;s what&apos;s happening with your store.</p>
    </div>
  )
}

function PendingReviewView() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-zinc-200 bg-white p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
          <ClockIcon />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-zinc-950">Your store is under review</h1>
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
          We&apos;re reviewing your store application. This typically takes 2–3 business days.
          We&apos;ll notify you by email once a decision has been made.
        </p>
        <div className="mt-6 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs font-medium text-zinc-600">While you wait, you can:</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {['Prepare your product photos', 'Write your brand story', 'Plan your launch pricing'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="h-1 w-1 rounded-full bg-zinc-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function DraftView() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-zinc-200 bg-white p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
          <EditIcon />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-zinc-950">Finish your store application</h1>
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
          You started a store application but haven&apos;t submitted it yet. Complete it to get
          reviewed by our team.
        </p>
        <button className="mt-6 w-full rounded-lg bg-zinc-950 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
          Continue application
        </button>
      </div>
    </div>
  )
}

function SuspendedView() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-zinc-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-zinc-950">Your store has been suspended</h1>
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
          Your store has been temporarily suspended. Please contact YIIVA support for more
          information.
        </p>
        <a
          href="mailto:support@yiiva.co.za"
          className="mt-6 inline-block text-sm font-medium text-zinc-950 hover:underline"
        >
          Contact support →
        </a>
      </div>
    </div>
  )
}

function ClosedView() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-zinc-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-zinc-950">Your store is closed</h1>
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
          This store has been closed. If you&apos;d like to start a new store, please contact
          support.
        </p>
        <a
          href="mailto:support@yiiva.co.za"
          className="mt-6 inline-block text-sm font-medium text-zinc-950 hover:underline"
        >
          Contact support →
        </a>
      </div>
    </div>
  )
}

function BuyerLandingView({ user }: { user: User }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Hey {user.firstName}, welcome to YIIVA.
        </h1>
        <p className="mt-1 text-sm text-zinc-500">What would you like to do?</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-950">Shop on YIIVA</h2>
          <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
            YIIVA shopping is a mobile experience. Download the app to discover and buy from South
            Africa&apos;s best independent brands.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex h-10 items-center justify-center rounded-lg border border-zinc-200 text-xs font-medium text-zinc-400">
              App Store — coming soon
            </div>
            <div className="flex h-10 items-center justify-center rounded-lg border border-zinc-200 text-xs font-medium text-zinc-400">
              Google Play — coming soon
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-950">Sell on YIIVA</h2>
          <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
            Turn your brand into a business. Apply to open your store and start selling to thousands
            of customers.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 flex h-10 items-center justify-center rounded-lg bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Set up my store
          </Link>
        </div>
      </div>
    </div>
  )
}

function ClockIcon() {
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
      className="text-zinc-600"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function EditIcon() {
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
      className="text-zinc-600"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
