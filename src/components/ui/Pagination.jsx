import Icon from './Icon'
import { num } from '../../utils/format'

export default function Pagination({ pagination, onPage }) {
  if (!pagination) return null
  const { page, limit, total, pages } = pagination
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm sm:flex-row">
      <p className="text-muted">
        Showing <span className="font-semibold text-ink">{num(from)}</span>–<span className="font-semibold text-ink">{num(to)}</span> of{' '}
        <span className="font-semibold text-ink">{num(total)}</span>
      </p>
      <div className="flex items-center gap-1">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <Icon name="chevronLeft" className="size-4" /> Prev
        </button>
        <span className="px-3 text-xs font-semibold text-muted">
          Page {page} / {Math.max(pages, 1)}
        </span>
        <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <Icon name="chevronRight" className="size-4" />
        </button>
      </div>
    </div>
  )
}
