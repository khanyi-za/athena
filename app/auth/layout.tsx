import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-[0.2em] text-foreground">YIIVA</span>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Merchant Dashboard</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
