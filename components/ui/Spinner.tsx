interface SpinnerProps {
  size?:      'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  xs: 'spinner-xs',
  sm: 'spinner-sm',
  md: 'spinner-md',
  lg: 'spinner-lg',
} as const

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={['spinner', sizeClass[size], className].filter(Boolean).join(' ')}
    />
  )
}