import type { HTMLAttributes } from 'react'

type Padding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padding?:   Padding
}

const paddingClass: Record<Padding, string> = {
  none: '',
  sm:   'card-p-sm',
  md:   'card-p-md',
  lg:   'card-p-lg',
}

export function Card({
  hoverable = false,
  padding   = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  const classes = [
    'card',
    hoverable ? 'card-hover cursor-pointer' : '',
    paddingClass[padding],
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}