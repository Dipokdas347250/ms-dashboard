import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import { Field } from '../ui/Common'
import { Spinner } from '../ui/Feedback'
import { ordersApi, productsApi } from '../../api/endpoints'
import { useToast } from '../../context/ToastContext'
import { AREAS, COMBO_PRICE, COMBO_SIZE, MAX_ITEMS_PER_ORDER, SIZES } from '../../utils/constants'
import { money } from '../../utils/format'

const EMPTY = { name: '', phone: '', address: '', area: 'inside', note: '' }

// Estimate only — mirrors server/services/orderService.calculateTotals; the server recalculates.
function estimate(lines, products, area) {
  const prices = lines
    .flatMap((l) => Array(l.quantity).fill(products.find((p) => p.slug === l.productId)?.price || 0))
    .sort((a, b) => b - a)
  const combos = Math.floor(prices.length / COMBO_SIZE)
  const subtotal = prices.reduce((s, p) => s + p, 0)
  const leftover = prices.slice(combos * COMBO_SIZE).reduce((s, p) => s + p, 0)
  const discount = Math.max(0, subtotal - (combos * COMBO_PRICE + leftover))
  const delivery = prices.length ? AREAS[area].fee : 0
  return { units: prices.length, subtotal, discount, delivery, total: subtotal - discount + delivery }
}

// Phone / walk-in orders go through the same public endpoint as the shop (POST /api/orders).
export default function NewOrderModal({ open, onClose, onCreated }) {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [lines, setLines] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // The parent mounts this only while open, so state starts fresh each time.
  useEffect(() => {
    productsApi
      .listPublic()
      .then(({ data }) => {
        setProducts(data)
        setLines(data[0] ? [{ productId: data[0].slug, size: 'L', quantity: 1 }] : [])
      })
      .catch((err) => setError(err.message))
  }, [])

  const totals = useMemo(() => estimate(lines, products, form.area), [lines, products, form.area])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setLine = (i, patch) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (totals.units > MAX_ITEMS_PER_ORDER) return setError(`Max ${MAX_ITEMS_PER_ORDER} items per order.`)
    setBusy(true)
    try {
      const { data } = await ordersApi.place({
        ...form,
        note: form.note || undefined,
        items: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: Number(l.quantity) })),
      })
      toast.success(data.duplicate ? `Duplicate — order ${data.orderId} already exists` : `Order ${data.orderId} created`)
      onCreated?.(data)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New order"
      subtitle="For phone or Messenger orders. Prices are recalculated by the server."
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" form="new-order" disabled={busy || !lines.length}>
            {busy ? <Spinner className="size-4 border-white/40 border-t-white" /> : <Icon name="check" className="size-4" />}
            Place order · {money(totals.total)}
          </button>
        </>
      }
    >
      <form id="new-order" onSubmit={submit} className="space-y-5">
        {error && <p className="rounded-xl bg-blush-50 p-3 text-sm text-blush-700 ring-1 ring-blush-200">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name">
            <input className="input" required minLength={2} value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Phone" hint="11 digits, e.g. 017XXXXXXXX">
            <input className="input" required value={form.phone} onChange={set('phone')} inputMode="tel" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <textarea className="input" required minLength={5} rows={2} value={form.address} onChange={set('address')} />
          </Field>
          <Field label="Delivery area">
            <select className="input" value={form.area} onChange={set('area')}>
              {Object.entries(AREAS).map(([k, a]) => (
                <option key={k} value={k}>
                  {a.label} (৳{a.fee})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Note (optional)">
            <input className="input" value={form.note} onChange={set('note')} maxLength={500} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Items</span>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              disabled={!products.length}
              onClick={() => setLines((ls) => [...ls, { productId: products[0].slug, size: 'L', quantity: 1 }])}
            >
              <Icon name="plus" className="size-3.5" /> Add item
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => {
              const product = products.find((p) => p.slug === l.productId)
              return (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-xl bg-canvas p-2 ring-1 ring-line">
                  <select className="input" value={l.productId} onChange={(e) => setLine(i, { productId: e.target.value })}>
                    {products.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} {p.color ? `· ${p.color}` : ''} — ৳{p.price}
                      </option>
                    ))}
                  </select>
                  <select className="input w-20" value={l.size} onChange={(e) => setLine(i, { size: e.target.value })}>
                    {SIZES.map((sz) => {
                      const v = product?.variants.find((x) => x.size === sz)
                      return (
                        <option key={sz} value={sz} disabled={v && !v.inStock}>
                          {sz}
                          {v && !v.inStock ? ' (out)' : ''}
                        </option>
                      )
                    })}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={MAX_ITEMS_PER_ORDER}
                    className="input w-20"
                    value={l.quantity}
                    onChange={(e) => setLine(i, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <button
                    type="button"
                    className="rounded-lg p-2 text-muted hover:bg-blush-50 hover:text-blush-600"
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                    aria-label="Remove item"
                  >
                    <Icon name="trash" className="size-4" />
                  </button>
                </div>
              )
            })}
            {!products.length && !error && <p className="text-sm text-muted">Loading products…</p>}
          </div>
        </div>

        <div className="rounded-xl bg-linear-to-br from-blush-50 to-brand-50 p-4 text-sm ring-1 ring-line">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal ({totals.units} items)</span>
            <span>{money(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-blush-600">
              <span>Combo discount</span>
              <span>−{money(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">Delivery</span>
            <span>{money(totals.delivery)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-brand-100 pt-2 font-bold text-ink">
            <span>Estimated total</span>
            <span>{money(totals.total)}</span>
          </div>
        </div>
      </form>
    </Modal>
  )
}
