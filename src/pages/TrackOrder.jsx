import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi } from '../api/endpoints'
import Icon from '../components/ui/Icon'
import { Field, PageHeader } from '../components/ui/Common'
import { PaymentBadge, StatusBadge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Feedback'
import { ORDER_STATUSES, STATUS_STYLES } from '../utils/constants'
import { capitalize, dateTime, money } from '../utils/format'

const FLOW = ORDER_STATUSES.slice(0, 5) // pending → delivered

// Uses the public tracking endpoint — exactly what a customer sees.
export default function TrackOrder() {
  const [form, setForm] = useState({ orderId: '', phone: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setBusy(true)
    try {
      const { data } = await ordersApi.track(form.orderId.trim(), form.phone.trim())
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const step = result ? FLOW.indexOf(result.status) : -1

  return (
    <>
      <PageHeader title="Track order" subtitle="Check an order the way the customer sees it. The phone number must match the order." />

      <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order ID">
          <input className="input uppercase" required placeholder="MS-261003-0001" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input className="input" required placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? <Spinner className="size-4 border-white/40 border-t-white" /> : <Icon name="search" className="size-4" />} Track
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-blush-50 p-4 text-sm text-blush-700 ring-1 ring-blush-200">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="card p-5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Order</p>
                <p className="text-xl font-extrabold text-ink">{result.orderId}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={result.status} />
                <PaymentBadge status={result.paymentStatus} />
              </div>
            </div>

            {step >= 0 ? (
              <div className="mt-6 flex items-center">
                {FLOW.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`grid size-9 place-items-center rounded-full text-white ${i <= step ? 'bg-linear-to-br from-blush-400 to-brand-600' : 'bg-line text-muted'}`}
                      >
                        {i < step ? <Icon name="check" className="size-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </span>
                      <span className={`text-[11px] font-semibold ${i <= step ? 'text-ink' : 'text-muted'}`}>{capitalize(s)}</span>
                    </div>
                    {i < FLOW.length - 1 && <div className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < step ? 'bg-brand-400' : 'bg-line'}`} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-blush-50 p-3 text-sm text-blush-700">This order was {result.status}.</p>
            )}

            <ul className="mt-6 divide-y divide-line">
              {result.items.map((it, i) => (
                <li key={i} className="flex justify-between py-2 text-sm">
                  <span>
                    {it.name} <span className="text-muted">{it.color}</span>
                  </span>
                  <span className="font-semibold">
                    {it.size} × {it.quantity}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-line pt-3 font-bold">
              <span>Total</span>
              <span>{money(result.total)}</span>
            </div>
            {result.trackingCode && (
              <p className="mt-3 text-sm text-muted">
                Courier tracking code: <span className="font-semibold text-ink">{result.trackingCode}</span>
              </p>
            )}
            <Link to={`/orders/${result.orderId}`} className="btn btn-soft mt-4">
              Open in admin <Icon name="chevronRight" className="size-4" />
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-bold text-ink">History</h2>
            <ol className="space-y-3">
              {[...result.history].reverse().map((h, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: STATUS_STYLES[h.status]?.color }} />
                  <span className="font-semibold">{capitalize(h.status)}</span>
                  <span className="ml-auto text-xs text-muted">{dateTime(h.at)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </>
  )
}
