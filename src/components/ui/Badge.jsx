import { PAYMENT_STYLES, STATUS_STYLES } from '../../utils/constants'
import { capitalize } from '../../utils/format'

export function Badge({ className = 'bg-brand-50 text-brand-700 ring-brand-200', children, dot }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${className}`}
    >
      {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.returned
  return (
    <Badge className={s.badge} dot={s.dot}>
      {capitalize(status)}
    </Badge>
  )
}

export function PaymentBadge({ status }) {
  return <Badge className={PAYMENT_STYLES[status] || PAYMENT_STYLES.unpaid}>{capitalize(status)}</Badge>
}
