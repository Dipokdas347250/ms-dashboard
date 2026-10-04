import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, ordersApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import BarChart from '../components/charts/BarChart'
import Icon from '../components/ui/Icon'
import { PageHeader, StatCard } from '../components/ui/Common'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback'
import { ORDER_STATUSES, STATUS_STYLES } from '../utils/constants'
import { bdDate, capitalize, money, num, timeAgo } from '../utils/format'

// Fill the last 7 days (BD time) so days without orders still show as zero.
function fillWeek(last7Days = []) {
  const byDate = new Map(last7Days.map((d) => [d.date, d]))
  return Array.from({ length: 7 }, (_, i) => {
    const key = bdDate(i - 6)
    const day = byDate.get(key) || { orders: 0, amount: 0 }
    const label = new Date(`${key}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
    return { key, label, orders: day.orders, amount: day.amount }
  })
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { admin } = useAuth()
  const summary = useApi(() => dashboardApi.summary(), [])
  const recent = useApi(() => ordersApi.list({ limit: 6 }), [])
  const [metric, setMetric] = useState('orders')

  const week = useMemo(() => fillWeek(summary.data?.last7Days), [summary.data])

  if (summary.error) return <ErrorState error={summary.error} onRetry={summary.reload} />

  const s = summary.data
  const counts = s?.statusCounts || {}
  const totalOrders = ORDER_STATUSES.reduce((sum, k) => sum + (counts[k]?.count || 0), 0)
  const weekOrders = week.reduce((a, d) => a + d.orders, 0)
  const weekAmount = week.reduce((a, d) => a + d.amount, 0)
  const needsAction = (counts.pending?.count || 0) + (counts.confirmed?.count || 0) + (counts.processing?.count || 0)

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${admin?.name?.split(' ')[0] || 'there'}`}
        subtitle="Here's what's happening in your shop today."
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => (summary.reload(), recent.reload())}>
              <Icon name="refresh" className="size-4" /> Refresh
            </button>
            <Link to="/orders?status=pending" className="btn btn-primary">
              <Icon name="orders" className="size-4" /> Pending orders
            </Link>
          </>
        }
      />

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!s ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card space-y-3 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Today's orders" value={num(s.today.orders)} hint={`${money(s.today.amount)} booked today`} icon="calendar" tone="mix" />
            <StatCard label="Delivered revenue" value={money(s.deliveredRevenue.amount)} hint={`${num(s.deliveredRevenue.orders)} orders delivered`} icon="wallet" tone="brand" />
            <StatCard label="Needs action" value={num(needsAction)} hint="Pending, confirmed or processing" icon="activity" tone="blush" />
            <StatCard label="Customers" value={num(s.customers)} hint={`${num(totalOrders)} orders all time`} icon="customers" tone="soft" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Last 7 days */}
        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-ink">Last 7 days</h2>
              <p className="text-sm text-muted">
                {num(weekOrders)} orders · {money(weekAmount)} (excluding cancelled & returned)
              </p>
            </div>
            <div className="flex rounded-xl bg-canvas p-1 ring-1 ring-line">
              {['orders', 'amount'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${metric === m ? 'bg-white text-brand-700 shadow-sm' : 'text-muted hover:text-ink'}`}
                >
                  {m === 'orders' ? 'Orders' : 'Revenue'}
                </button>
              ))}
            </div>
          </div>
          {!s ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <BarChart
              data={week.map((d) => ({
                label: d.label,
                value: d[metric],
                sub: metric === 'orders' ? `${money(d.amount)} · ${d.key}` : `${num(d.orders)} orders · ${d.key}`,
              }))}
              format={metric === 'orders' ? num : money}
            />
          )}
        </section>

        {/* Status breakdown */}
        <section className="card p-5">
          <h2 className="font-bold text-ink">Orders by status</h2>
          <p className="text-sm text-muted">{num(totalOrders)} orders in total</p>
          <ul className="mt-4 space-y-3">
            {ORDER_STATUSES.map((st) => {
              const c = counts[st]?.count || 0
              const pct = totalOrders ? (c / totalOrders) * 100 : 0
              return (
                <li key={st}>
                  <Link to={`/orders?status=${st}`} className="group block">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-ink group-hover:text-brand-600">
                        <span className={`size-2 rounded-full ${STATUS_STYLES[st].dot}`} />
                        {capitalize(st)}
                      </span>
                      <span className="text-muted">
                        <span className="font-semibold text-ink">{num(c)}</span> · {money(counts[st]?.amount)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: STATUS_STYLES[st].color }} />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Recent orders */}
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-bold text-ink">Recent orders</h2>
            <Link to="/orders" className="text-sm font-semibold text-brand-600 hover:text-blush-500">
              View all →
            </Link>
          </div>
          {recent.error ? (
            <p className="px-5 pb-5 text-sm text-blush-600">{recent.error.message}</p>
          ) : !recent.data ? (
            <div className="space-y-3 px-5 pb-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.data.items.length === 0 ? (
            <EmptyState icon="orders" title="No orders yet" message="Orders from the shop will show up here." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.data.items.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <Link to={`/orders/${o.orderId}`} className="font-semibold text-brand-700 hover:text-blush-500">
                          {o.orderId}
                        </Link>
                        <p className="text-xs text-muted">{timeAgo(o.createdAt)}</p>
                      </td>
                      <td>
                        <p className="font-medium">{o.shipping.name}</p>
                        <p className="text-xs text-muted">{o.shipping.phone}</p>
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="text-right font-semibold">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Low stock */}
        <section className="card p-5">
          <h2 className="font-bold text-ink">Low stock</h2>
          {!s ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : !s.trackStock ? (
            <div className="mt-4 rounded-xl bg-brand-50/60 p-4 text-sm text-muted ring-1 ring-brand-100">
              Stock tracking is off. Set <code className="font-semibold text-brand-700">TRACK_STOCK=true</code> in the server's{' '}
              <code>.env</code> to reject sold-out sizes and get alerts here.
            </div>
          ) : s.lowStock.length === 0 ? (
            <EmptyState icon="check" title="All stocked up" message="No size has 5 or fewer shirts left." />
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {s.lowStock.map((p) => (
                <li key={p._id} className="py-3">
                  <p className="text-sm font-semibold text-ink">
                    {p.name} <span className="font-normal text-muted">{p.color}</span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.variants.map((v) => (
                      <span
                        key={v.size}
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          v.stock === 0 ? 'bg-blush-100 text-blush-700' : v.stock <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-canvas text-muted'
                        }`}
                      >
                        {v.size}: {v.stock}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/products" className="btn btn-soft mt-4 w-full">
            <Icon name="products" className="size-4" /> Manage products
          </Link>
        </section>
      </div>
    </>
  )
}
