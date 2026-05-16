type Status = 'pending' | 'under_review' | 'accepted' | 'declined' | 'neutral' | 'success'

interface BadgeProps {
  status?:   Status
  children?: React.ReactNode
  className?: string
}

const variantClass: Record<Status, string> = {
  pending:      'badge-pending',
  under_review: 'badge-review',
  accepted:     'badge-accepted',
  declined:     'badge-declined',
  neutral:      'badge-neutral',
  success:      'badge-accepted', // Reusing accepted styles or custom green ones
}

const dotClass: Record<Status, string> = {
  pending:      'bg-[#F59E0B]',
  under_review: 'bg-[#3B82F6]',
  accepted:     'bg-[#10B981]',
  declined:     'bg-[#EF4444]',
  neutral:      'bg-[#8BA4C8]',
  success:      'bg-[#10B981]', // Green dot
}

export function Badge({ status = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span className={['badge', variantClass[status], className].filter(Boolean).join(' ')}>
      <span className={['badge-dot', dotClass[status]].join(' ')} />
      {children}
    </span>
  )
}