export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-6 py-5">
        <span className="text-sm font-bold tracking-[0.2em] text-foreground">YIIVA</span>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        {children}
      </main>
    </div>
  )
}
