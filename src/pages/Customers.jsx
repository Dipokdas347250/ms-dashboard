import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { customersApi } from '../api/endpoints'
import { useApi, useDebounced } from '../hooks/useApi'
import Pagination from '../components/ui/Pagination'
import { Avatar, PageHeader, SearchInput } from '../components/ui/Common'
import { Badge } from '../components/ui/Badge'
import { EmptyState, ErrorState, Spinner } from '../components/ui/Feedback'
import { AREAS } from '../utils/constants'
import { money, num, timeAgo } from '../utils/format'

const SORTS = [
  ['recent', 'Recent order'],
  ['orders', 'Most orders'],
  ['spent', 'Top spenders'],
  ['newest', 'Newest'],
]

export default function Customers() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('recent')
  const [blocked, setBlocked] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQ = useDebounced(q)

  const { data, error, loading, reload } = useApi(
    () => customersApi.list({ q: debouncedQ, sort, blocked, page, limit: 15 }),
    [debouncedQ, sort, blocked, page],
  )

  const filter = (fn) => (v) => (fn(v), setPage(1))

  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone who has ordered, one profile per phone number." />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr]">
        <SearchInput value={q} onChange={filter(setQ)} placeholder="Search name, phone, address…" />
        <select className="input" value={sort} onChange={(e) => filter(setSort)(e.target.value)}>
          {SORTS.map(([v, label]) => (
            <option key={v} value={v}>
              Sort: {label}
            </option>
          ))}
        </select>
        <select className="input" value={blocked} onChange={(e) => filter(setBlocked)(e.target.value)}>
          <option value="">All customers</option>
          <option value="false">Active only</option>
          <option value="true">Blocked only</option>
        </select>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <div className="card relative overflow-hidden">
          {loading && data && <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-linear-to-r from-blush-400 to-brand-500" />}
          {!data ? (
            <div className="flex justify-center py-20">
              <Spinner className="size-8" />
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState icon="customers" title="No customers found" message="Customers are created automatically when they order." />
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Address</th>
                      <th className="text-right">Orders</th>
                      <th className="text-right">Spent</th>
                      <th>Last order</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((c) => (
                      <tr key={c._id} className="cursor-pointer" onClick={() => navigate(`/customers/${c._id}`)}>
                        <td>
                          <Link to={`/customers/${c._id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                            <Avatar name={c.name} />
                            <span>
                              <span className="block font-semibold whitespace-nowrap text-ink hover:text-brand-600">{c.name}</span>
                              <span className="block text-xs text-muted">{c.phone}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="max-w-64">
                          <p className="truncate text-sm">{c.address || '—'}</p>
                          <p className="text-xs text-muted">{AREAS[c.area]?.label}</p>
                        </td>
                        <td className="text-right font-semibold">{num(c.orderCount)}</td>
                        <td className="text-right font-semibold whitespace-nowrap">{money(c.totalSpent)}</td>
                        <td className="whitespace-nowrap text-muted">{timeAgo(c.lastOrderAt)}</td>
                        <td>
                          {c.isBlocked ? (
                            <Badge className="bg-blush-50 text-blush-700 ring-blush-200">Blocked</Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Active</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={data.pagination} onPage={setPage} />
            </>
          )}
        </div>
      )}
    </>
  )
}
