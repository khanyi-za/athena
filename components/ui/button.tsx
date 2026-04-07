import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
  fullWidth?: boolean
}

export function Button({
  loading,
  variant = 'primary',
  fullWidth = true,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium py-2.5 px-4 transition-colors disabled:cursor-not-allowed'

  const variants: Record<string, string> = {
    primary: 'bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500',
    ghost:
      'bg-transparent text-zinc-700 border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50',
  }

  return (
    <button
      disabled={disabled || loading}
      className={[base, variants[variant], fullWidth ? 'w-full' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
