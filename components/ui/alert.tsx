interface AlertProps {
  variant?: 'error' | 'info'
  children: React.ReactNode
  className?: string
}

export function Alert({ variant = 'error', children, className }: AlertProps) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-zinc-200 bg-zinc-50 text-zinc-600',
  }

  return (
    <div className={['rounded-lg border p-3 text-sm', styles[variant], className ?? ''].join(' ')}>
      {children}
    </div>
  )
}
