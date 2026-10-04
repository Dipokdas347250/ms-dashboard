import Icon from './Icon'

export function Spinner({ className = 'size-5' }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-brand-200 border-t-brand-600 ${className}`} />
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-muted">
      <Spinner className="size-8" />
      {label}
    </div>
  )
}

export function EmptyState({ icon = 'box', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-linear-to-br from-blush-50 to-brand-50 text-brand-500">
        <Icon name={icon} className="size-7" />
      </span>
      <h3 className="font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-blush-50 text-blush-500">
        <Icon name="alert" className="size-7" />
      </span>
      <h3 className="font-semibold text-ink">Couldn't load this</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button className="btn btn-soft mt-4" onClick={onRetry}>
          <Icon name="refresh" className="size-4" /> Try again
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-lg bg-brand-50 ${className}`} />
}
