import { clsx } from 'clsx'

type Variant = 'primary' | 'dark' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-turq text-white shadow-[0_8px_28px_rgba(46,196,182,0.32)] hover:bg-turq-deep hover:-translate-y-px active:scale-[0.97]',
  dark:    'bg-ink text-white hover:bg-turq-deep',
  outline: 'bg-transparent text-ink border-2 border-ink/15 hover:border-turq hover:text-turq-deep',
  ghost:   'bg-transparent text-muted hover:text-ink',
}

const sizes: Record<Size, string> = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-7 py-3.5 text-base',
  lg: 'px-8 py-4 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2',
        'font-nunito font-black rounded-pill',
        'transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  )
}
