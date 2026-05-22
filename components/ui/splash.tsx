// Full-page loading shell shown while the app is restoring the session
// (silent refresh + /auth/me on init). Per docs/Api-frontend-contracts/auth-frontend-flows.md
// §5 — "Render a splash, not the wrong screen" during the 200–800ms init window.

interface SplashProps {
  message?: string
}

export function Splash({ message }: SplashProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4">
      <div className="flex flex-col items-center gap-4">
        <span className="text-sm font-bold tracking-[0.2em] text-zinc-950">YIIVA</span>
        <div
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
        />
      </div>
      {message ? <p className="text-sm text-zinc-500">{message}</p> : null}
    </div>
  )
}
