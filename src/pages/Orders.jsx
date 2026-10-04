import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ordersApi } from '../api/endpoints'
import { useApi, useDebounced } from '../hooks/useApi'
import Icon from '../components/ui/Icon'
import Pagination from '../components/ui/Pagination'
import NewOrderModal from '../components/orders/NewOrderModal'
import { PageHeader, SearchInput } from '../components/ui/Common'
import { PaymentBadge, StatusBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState, Spinner } from '../components/ui/Feedback'
import { AREAS, ORDER_STATUSES, STATUS_STYLES } from '../utils/constants'
import { bdDate, capitalize, dateTime, money } from '../utils/format'

export default function Orders() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [newOpen, setNewOpen] = useState(false)
  const debouncedQ = useDebounced(q)

  const statuses = params.get('status')?.split(',').filter(Boolean) || []
  const area = params.get('area') || ''
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const page = Number(params.get('page')) || 1

  const update = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k))
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  // Keep the URL in sync with the search box (also picks up the top bar search).
  useEffect(() => {
    if ((params.get('q') || '') !== debouncedQ) update({ q: debouncedQ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ])
  // When q changes from outside (top bar search, Clear), copy it into the box.
  const urlQ = params.get('q') || ''
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ)
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ)
    setQ(urlQ)
  }

  const query = { status: statuses.join(','), q: params.get('q'), area, from, to, page, limit: 15 }
  const { data, error, loading, reload } = useApi(() => ordersApi.list(query), [params.toString()])

  const toggleStatus = (s) => update({ status: (statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s]).join(',') })
  const hasFilters = statuses.length || area || from || to || params.get('q')

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Search, filter and process every order from the shop."
        actions={
          <>
            <button className="btn btn-ghost" onClick={reload}>
              <Icon name="refresh" className="size-4" /> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setNewOpen(true)}>
              <Icon name="plus" className="size-4" /> New order
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="card mb-4 space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => update({ status: '' })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
              !statuses.length ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-muted ring-line hover:ring-brand-300'
            }`}
          >
            All
          </button>
          {ORDER_STATUSES.map((s) => {
            const on = statuses.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                  on ? 'bg-brand-50 text-brand-700 ring-brand-300' : 'bg-white text-muted ring-line hover:ring-brand-300'
                }`}
              >
                <span className={`size-1.5 rounded-full ${STATUS_STYLES[s].dot}`} />
                {capitalize(s)}
              </button>
            )
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <SearchInput value={q} onChange={setQ} placeholder="Order ID, phone, name, tracking code…" />
          <select className="input" value={area} onChange={(e) => update({ area: e.target.value })}>
            <option value="">All areas</option>
            {Object.entries(AREAS).map(([k, a]) => (
              <option key={k} value={k}>
                {a.label}
              </option>
            ))}
          </select>
          <input type="date" className="input" value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value })} aria-label="From date" />
          <input type="date" className="input" value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value })} aria-label="To date" />
          <div className="flex gap-2">
            <button className="btn btn-soft flex-1" onClick={() => update({ from: bdDate(), to: bdDate() })}>
              Today
            </button>
            {hasFilters ? (
              <button className="btn btn-danger" onClick={() => (setQ(''), setParams({}, { replace: true }))}>
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <div className="card relative overflow-hidden">
          {loading && data && (
            <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-linear-to-r from-blush-400 to-brand-500" />
          )}
          {!data ? (
            <div className="flex justify-center py-20">
              <Spinner className="size-8" />
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState
              icon="orders"
              title="No orders found"
              message={hasFilters ? 'Try a different filter or search term.' : 'New orders from the shop will appear here.'}
            />
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Area</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((o) => (
                      <tr key={o._id} className="cursor-pointer" onClick={() => navigate(`/orders/${o.orderId}`)}>
                        <td>
                          <Link
                            to={`/orders/${o.orderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold whitespace-nowrap text-brand-700 hover:text-blush-500"
                          >
                            {o.orderId}
                          </Link>
                          <p className="text-xs whitespace-nowrap text-muted">{dateTime(o.createdAt)}</p>
                        </td>
                        <td>
                          <p className="font-medium whitespace-nowrap">{o.shipping.name}</p>
                          <p className="text-xs text-muted">{o.shipping.phone}</p>
                        </td>
                        <td className="max-w-56">
                          <p className="truncate text-sm">{o.items.map((i) => `${i.name} ${i.size}×${i.quantity}`).join(', ')}</p>
                          {o.isCombo && <span className="text-xs font-semibold text-blush-500">Combo</span>}
                        </td>
                        <td className="whitespace-nowrap text-muted">{AREAS[o.shipping.area]?.label}</td>
                        <td>
                          <StatusBadge status={o.status} />
                        </td>
                        <td>
                          <PaymentBadge status={o.paymentStatus} />
                        </td>
                        <td className="text-right font-semibold whitespace-nowrap">{money(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={data.pagination} onPage={(p) => update({ page: String(p) })} />
            </>
          )}
        </div>
      )}

      {newOpen && <NewOrderModal open onClose={() => setNewOpen(false)} onCreated={reload} />}
    </>
  )
}
