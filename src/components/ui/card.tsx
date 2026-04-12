import { clsx } from 'clsx'

type CardVariant = 'white' | 'offwhite' | 'dark' | 'turq'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'sm' | 'md' | 'lg'
}

const variants: Record<CardVariant, string> = {
  white:    'bg-white border border-ink/7',
  offwhite: 'bg-offwhite',
  dark:     'bg-ink',
  turq:     'bg-turq',
}

const paddings = {
  sm: 'p-5',
  md: 'p-6',
  lg: 'p-8 md:p-11',
}

export function Card({
  variant = 'white',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-card',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
