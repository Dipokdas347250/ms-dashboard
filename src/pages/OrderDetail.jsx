import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ordersApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { Field, InfoRow, PageHeader } from '../components/ui/Common'
import { Badge, PaymentBadge, StatusBadge } from '../components/ui/Badge'
import { ErrorState, PageLoader, Spinner } from '../components/ui/Feedback'
import { AREAS, PAYMENT_STATUSES, STATUS_STYLES } from '../utils/constants'
import { capitalize, dateTime, money, num } from '../utils/format'

const EDITABLE = ['pending', 'confirmed', 'processing']

const ACTION_STYLE = {
  confirmed: 'btn-primary',
  processing: 'btn-soft',
  shipped: 'btn-primary',
  delivered: 'btn-primary',
  cancelled: 'btn-danger',
  returned: 'btn-danger',
}

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { data: order, error, loading, reload } = useApi(() => ordersApi.get(id), [id])
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusNote, setStatusNote] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [shipping, setShipping] = useState(null)
  const [adminNote, setAdminNote] = useState(null)
  const [busy, setBusy] = useState('')

  // Runs an action, toasts the result and reloads the order (populated + allowedStatuses).
  const run = async (key, fn) => {
    setBusy(key)
    try {
      const { message } = await fn()
      toast.success(message || 'Saved')
      await reload()
      return true
    } catch (err) {
      toast.error(err)
      return false
    } finally {
      setBusy('')
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!order) return <PageLoader />

  const changeStatus = async () => {
    const ok = await run('status', () => ordersApi.updateStatus(order.orderId, statusTarget, statusNote.trim()))
    if (ok) setStatusTarget(null)
  }

  const saveShipping = async (e) => {
    e.preventDefault()
    const ok = await run('shipping', () => ordersApi.update(order.orderId, { shipping }))
    if (ok) setEditOpen(false)
  }

  const noteValue = adminNote ?? order.adminNote ?? ''
  const canEditShipping = EDITABLE.includes(order.status)
  const canSendCourier = ['confirmed', 'processing'].includes(order.status) && !order.courier?.consignmentId
  const units = order.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <>
      <PageHeader
        back={
          <Link to="/orders" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand-600">
            <Icon name="arrowLeft" className="size-4" /> Orders
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.orderId} <StatusBadge status={order.status} />
          </span>
        }
        subtitle={`Placed ${dateTime(order.createdAt)} · ${num(units)} item${units === 1 ? '' : 's'} · Cash on delivery`}
        actions={
          <>
            <button className="btn btn-ghost" onClick={reload} disabled={loading}>
              <Icon name="refresh" className="size-4" /> Refresh
            </button>
            {order.allowedStatuses?.map((s) => (
              <button key={s} className={`btn ${ACTION_STYLE[s]}`} onClick={() => (setStatusNote(''), setStatusTarget(s))}>
                Mark {s}
              </button>
            ))}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-bold text-ink">Items</h2>
              {order.isCombo && <Badge className="bg-blush-50 text-blush-700 ring-blush-200">Combo applied</Badge>}
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit</th>
                    <th className="text-right">Line</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i}>
                      <td>
                        <p className="font-semibold">{it.name}</p>
                        <p className="text-xs text-muted">{it.color || it.slug}</p>
                      </td>
                      <td>
                        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{it.size}</span>
                      </td>
                      <td className="text-right">{it.quantity}</td>
                      <td className="text-right text-muted">{money(it.unitPrice)}</td>
                      <td className="text-right font-semibold">{money(it.unitPrice * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ml-auto max-w-xs space-y-1 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-blush-600">
                  <span>Combo discount</span>
                  <span>−{money(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Delivery ({AREAS[order.shipping.area]?.label})</span>
                <span>{money(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold text-ink">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="card p-5">
            <h2 className="mb-4 font-bold text-ink">Status history</h2>
            <ol className="relative space-y-5 border-l-2 border-brand-100 pl-6">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute top-1 -left-[31px] size-3.5 rounded-full ring-4 ring-white"
                    style={{ background: STATUS_STYLES[h.status]?.color }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{capitalize(h.status)}</span>
                    <span className="text-xs text-muted">{dateTime(h.at)}</span>
                  </div>
                  <p className="text-sm text-muted">
                    {h.changedBy?.name ? `by ${h.changedBy.name}` : i === order.statusHistory.length - 1 ? 'Placed by customer' : 'System'}
                    {h.note && <span className="text-ink"> — {h.note}</span>}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {order.customerNote && (
            <section className="card border-blush-200 bg-blush-50/40 p-5">
              <h2 className="flex items-center gap-2 font-bold text-ink">
                <Icon name="note" className="size-4 text-blush-500" /> Customer note
              </h2>
              <p className="mt-2 text-sm whitespace-pre-wrap">{order.customerNote}</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {/* Shipping */}
          <section className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-bold text-ink">Shipping</h2>
              {canEditShipping && (
                <button className="btn btn-soft btn-sm" onClick={() => (setShipping({ ...order.shipping }), setEditOpen(true))}>
                  <Icon name="edit" className="size-3.5" /> Edit
                </button>
              )}
            </div>
            <p className="font-semibold">{order.shipping.name}</p>
            <a href={`tel:${order.shipping.phone}`} className="mt-1 flex items-center gap-2 text-sm text-brand-700 hover:text-blush-500">
              <Icon name="phone" className="size-4" /> {order.shipping.phone}
            </a>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted">
              <Icon name="mapPin" className="mt-0.5 size-4 shrink-0" /> {order.shipping.address}
            </p>
            <Badge className="mt-3 bg-brand-50 text-brand-700 ring-brand-200">{AREAS[order.shipping.area]?.label}</Badge>
          </section>

          {/* Customer */}
          {order.customer && (
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-ink">Customer</h2>
                <Link to={`/customers/${order.customer._id}`} className="text-sm font-semibold text-brand-600 hover:text-blush-500">
                  Profile →
                </Link>
              </div>
              <div className="mt-2 divide-y divide-line">
                <InfoRow label="Orders">{num(order.customer.orderCount)}</InfoRow>
                <InfoRow label="Total spent">{money(order.customer.totalSpent)}</InfoRow>
                <InfoRow label="Status">
                  {order.customer.isBlocked ? (
                    <Badge className="bg-blush-50 text-blush-700 ring-blush-200">Blocked</Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Active</Badge>
                  )}
                </InfoRow>
              </div>
              {order.customer.notes && <p className="mt-2 rounded-lg bg-canvas p-2 text-xs text-muted">{order.customer.notes}</p>}
            </section>
          )}

          {/* Payment */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink">Payment</h2>
              <PaymentBadge status={order.paymentStatus} />
            </div>
            <p className="mt-1 text-sm text-muted">Cash on delivery. Delivered orders are marked paid automatically.</p>
            <div className="mt-3 flex gap-2">
              {PAYMENT_STATUSES.map((p) => (
                <button
                  key={p}
                  disabled={busy === 'payment' || order.paymentStatus === p}
                  onClick={() => run('payment', () => ordersApi.update(order.orderId, { paymentStatus: p }))}
                  className={`btn btn-sm flex-1 ${order.paymentStatus === p ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {capitalize(p)}
                </button>
              ))}
            </div>
          </section>

          {/* Courier */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-bold text-ink">
              <Icon name="truck" className="size-5 text-brand-500" /> Courier
            </h2>
            {order.courier?.consignmentId ? (
              <>
                <div className="mt-2 divide-y divide-line">
                  <InfoRow label="Provider">{capitalize(order.courier.provider)}</InfoRow>
                  <InfoRow label="Consignment">{order.courier.consignmentId}</InfoRow>
                  <InfoRow label="Tracking">{order.courier.trackingCode || '—'}</InfoRow>
                  <InfoRow label="Courier status">{order.courier.status || '—'}</InfoRow>
                  <InfoRow label="Sent">{dateTime(order.courier.sentAt)}</InfoRow>
                </div>
                <button
                  className="btn btn-soft mt-3 w-full"
                  disabled={busy === 'sync'}
                  onClick={() => run('sync', () => ordersApi.syncCourier(order.orderId))}
                >
                  {busy === 'sync' ? <Spinner className="size-4" /> : <Icon name="refresh" className="size-4" />} Sync status
                </button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted">
                  {canSendCourier
                    ? 'Create a Steadfast parcel. The order will be marked shipped.'
                    : 'Confirm the order first. Only confirmed or processing orders can be sent.'}
                </p>
                <button
                  className="btn btn-accent mt-3 w-full"
                  disabled={!canSendCourier || busy === 'courier'}
                  onClick={() => run('courier', () => ordersApi.sendToCourier(order.orderId))}
                >
                  {busy === 'courier' ? <Spinner className="size-4 border-white/40 border-t-white" /> : <Icon name="truck" className="size-4" />}
                  Send to Steadfast
                </button>
              </>
            )}
          </section>

          {/* Admin note */}
          <section className="card p-5">
            <h2 className="font-bold text-ink">Internal note</h2>
            <textarea
              rows={3}
              className="input mt-2"
              placeholder="Only admins can see this"
              value={noteValue}
              onChange={(e) => setAdminNote(e.target.value)}
              maxLength={1000}
            />
            <button
              className="btn btn-soft mt-2 w-full"
              disabled={busy === 'note' || noteValue === (order.adminNote ?? '')}
              onClick={async () => {
                if (await run('note', () => ordersApi.update(order.orderId, { adminNote: noteValue }))) setAdminNote(null)
              }}
            >
              Save note
            </button>
          </section>
        </div>
      </div>

      {/* Status change */}
      <Modal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        size="sm"
        title={`Mark order ${statusTarget}?`}
        subtitle={
          statusTarget === 'cancelled' || statusTarget === 'returned'
            ? 'Stock is restored and the amount is removed from the customer total.'
            : statusTarget === 'delivered'
              ? 'The order is marked paid.'
              : undefined
        }
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setStatusTarget(null)}>
              Cancel
            </button>
            <button className={`btn ${ACTION_STYLE[statusTarget] === 'btn-danger' ? 'btn-accent' : 'btn-primary'}`} onClick={changeStatus} disabled={busy === 'status'}>
              {busy === 'status' ? 'Saving…' : `Mark ${statusTarget}`}
            </button>
          </>
        }
      >
        <Field label="Note (optional)">
          <textarea className="input" rows={3} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} maxLength={500} />
        </Field>
      </Modal>

      {/* Shipping edit */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit shipping"
        subtitle="Changing the area updates the delivery fee and total."
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" form="shipping-form" disabled={busy === 'shipping'}>
              {busy === 'shipping' ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {shipping && (
          <form id="shipping-form" onSubmit={saveShipping} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className="input" required value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" required value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <textarea className="input" rows={2} required value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
            </Field>
            <Field label="Area">
              <select className="input" value={shipping.area} onChange={(e) => setShipping({ ...shipping, area: e.target.value })}>
                {Object.entries(AREAS).map(([k, a]) => (
                  <option key={k} value={k}>
                    {a.label} (৳{a.fee})
                  </option>
                ))}
              </select>
            </Field>
          </form>
        )}
      </Modal>
    </>
  )
}
