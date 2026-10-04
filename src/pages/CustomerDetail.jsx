import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { customersApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import Icon from '../components/ui/Icon'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import { Avatar, Field, PageHeader, StatCard } from '../components/ui/Common'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState, PageLoader } from '../components/ui/Feedback'
import { AREAS } from '../utils/constants'
import { date, dateTime, money, num } from '../utils/format'

export default function CustomerDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { data: c, error, reload } = useApi(() => customersApi.get(id), [id])
  const [form, setForm] = useState(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!c) return <PageLoader />

  const save = async (payload) => {
    setBusy(true)
    try {
      const res = await customersApi.update(c._id, payload)
      toast.success(res.message)
      await reload()
      return true
    } catch (err) {
      toast.error(err)
      return false
    } finally {
      setBusy(false)
    }
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (await save(form)) setForm(null)
  }

  const delivered = c.orders.filter((o) => o.status === 'delivered').length

  return (
    <>
      <PageHeader
        back={
          <Link to="/customers" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand-600">
            <Icon name="arrowLeft" className="size-4" /> Customers
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={c.name} className="size-11 text-sm" />
            {c.name}
            {c.isBlocked && <Badge className="bg-blush-50 text-blush-700 ring-blush-200">Blocked</Badge>}
          </span>
        }
        subtitle={`Customer since ${date(c.createdAt)}`}
        actions={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setForm({ name: c.name, phone: c.phone, address: c.address || '', area: c.area || 'inside', notes: c.notes || '' })}
            >
              <Icon name="edit" className="size-4" /> Edit
            </button>
            <button className={`btn ${c.isBlocked ? 'btn-soft' : 'btn-danger'}`} onClick={() => setBlockOpen(true)}>
              <Icon name="ban" className="size-4" /> {c.isBlocked ? 'Unblock' : 'Block'}
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={num(c.orderCount)} hint={`${delivered} delivered`} icon="orders" tone="brand" />
        <StatCard label="Total spent" value={money(c.totalSpent)} hint="Excludes cancelled & returned" icon="wallet" tone="mix" />
        <StatCard label="Last order" value={c.lastOrderAt ? date(c.lastOrderAt) : '—'} icon="calendar" tone="blush" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="font-bold text-ink">Contact</h2>
          <a href={`tel:${c.phone}`} className="mt-3 flex items-center gap-2 text-sm text-brand-700 hover:text-blush-500">
            <Icon name="phone" className="size-4" /> {c.phone}
          </a>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted">
            <Icon name="mapPin" className="mt-0.5 size-4 shrink-0" /> {c.address || 'No address'}
          </p>
          {c.area && <Badge className="mt-3 bg-brand-50 text-brand-700 ring-brand-200">{AREAS[c.area]?.label}</Badge>}
          <h3 className="mt-5 text-xs font-semibold tracking-wide text-muted uppercase">Notes</h3>
          <p className="mt-1 text-sm whitespace-pre-wrap">{c.notes || <span className="text-muted">No notes yet.</span>}</p>
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <h2 className="px-5 py-4 font-bold text-ink">Order history</h2>
          {c.orders.length === 0 ? (
            <EmptyState icon="orders" title="No orders" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {c.orders.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <Link to={`/orders/${o.orderId}`} className="font-semibold whitespace-nowrap text-brand-700 hover:text-blush-500">
                          {o.orderId}
                        </Link>
                        <p className="text-xs whitespace-nowrap text-muted">{dateTime(o.createdAt)}</p>
                      </td>
                      <td className="max-w-64">
                        <p className="truncate text-sm">{o.items.map((i) => `${i.name} ${i.size}×${i.quantity}`).join(', ')}</p>
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
      </div>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title="Edit customer"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setForm(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" form="customer-form" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {form && (
          <form id="customer-form" onSubmit={submitEdit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Area">
              <select className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                {Object.entries(AREAS).map(([k, a]) => (
                  <option key={k} value={k}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes" className="sm:col-span-2" hint="Only admins see this">
              <textarea className="input" rows={3} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        busy={busy}
        danger={!c.isBlocked}
        title={c.isBlocked ? `Unblock ${c.name}?` : `Block ${c.name}?`}
        message={
          c.isBlocked
            ? 'This number will be able to place orders again.'
            : `Orders from ${c.phone} will be rejected. Use this for fake or repeated no-show orders.`
        }
        confirmLabel={c.isBlocked ? 'Unblock' : 'Block'}
        onConfirm={async () => {
          if (await save({ isBlocked: !c.isBlocked })) setBlockOpen(false)
        }}
      />
    </>
  )
}
