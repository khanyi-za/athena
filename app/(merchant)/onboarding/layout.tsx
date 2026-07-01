import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-5">
        <span className="text-sm font-bold tracking-[0.2em] text-foreground">YIIVA</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        {children}
      </main>
    </div>
  )
}
