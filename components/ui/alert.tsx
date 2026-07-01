interface AlertProps {
  variant?: 'error' | 'info'
  children: React.ReactNode
  className?: string
}

export function Alert({ variant = 'error', children, className }: AlertProps) {
  // YIIVA redesign — token-driven, theme-aware. Public API unchanged.
  const styles = {
    error: 'border-danger/30 bg-danger/5 text-danger',
    info: 'border-border bg-muted text-muted-foreground',
  }

  return (
    <div className={['rounded-lg border p-3 text-sm', styles[variant], className ?? ''].join(' ')}>
      {children}
    </div>
  )
}
