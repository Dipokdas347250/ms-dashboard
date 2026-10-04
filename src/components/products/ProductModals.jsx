import { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import { Field, Toggle } from '../ui/Common'
import { Spinner } from '../ui/Feedback'
import { assetUrl } from '../../api/client'
import { productsApi } from '../../api/endpoints'
import { useToast } from '../../context/ToastContext'
import { SIZES } from '../../utils/constants'

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const BLANK = {
  slug: '',
  name: '',
  color: '',
  price: 450,
  description: '',
  imagePosition: '',
  sortOrder: 0,
  isActive: true,
  variants: SIZES.map((size) => ({ size, stock: 0 })),
}

// Create (product = null) or edit. Editing loads the latest copy via GET /products/admin/:id.
// Mounted only while open, so state starts fresh each time.
export function ProductFormModal({ product, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(product)
  const [form, setForm] = useState(BLANK)
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!product) return
    productsApi
      .get(product._id)
      .then(({ data }) =>
        setForm({
          ...BLANK,
          ...data,
          color: data.color || '',
          description: data.description || '',
          imagePosition: data.imagePosition || '',
          variants: SIZES.map((size) => data.variants.find((v) => v.size === size) || { size, stock: 0 }),
        }),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [product])

  const set = (k) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [k]: value, ...(k === 'name' && !slugTouched ? { slug: slugify(value) } : {}) }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      slug: form.slug,
      name: form.name,
      color: form.color,
      price: Number(form.price),
      description: form.description,
      imagePosition: form.imagePosition,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      variants: form.variants.map((v) => ({ size: v.size, stock: Number(v.stock) || 0 })),
    }
    try {
      const res = isEdit ? await productsApi.update(product._id, payload) : await productsApi.create(payload)
      toast.success(res.message)
      onSaved(res.data)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${product.name}` : 'New product'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" form="product-form" disabled={busy || loading}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-7" />
        </div>
      ) : (
        <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {error && <p className="rounded-xl bg-blush-50 p-3 text-sm text-blush-700 ring-1 ring-blush-200 sm:col-span-2">{error}</p>}
          <Field label="Name">
            <input className="input" required value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Slug" hint="Used by the shop, e.g. love-navy">
            <input
              className="input"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={form.slug}
              onChange={(e) => (setSlugTouched(true), set('slug')(e))}
            />
          </Field>
          <Field label="Color">
            <input className="input" value={form.color} onChange={set('color')} />
          </Field>
          <Field label="Price (৳)">
            <input type="number" min={0} className="input" required value={form.price} onChange={set('price')} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea className="input" rows={2} value={form.description} onChange={set('description')} />
          </Field>
          <Field label="Image position" hint="CSS object-position, e.g. 30% center">
            <input className="input" value={form.imagePosition} onChange={set('imagePosition')} />
          </Field>
          <Field label="Sort order">
            <input type="number" className="input" value={form.sortOrder} onChange={set('sortOrder')} />
          </Field>
          <div className="sm:col-span-2">
            <span className="label">Stock per size</span>
            <div className="grid grid-cols-4 gap-2">
              {form.variants.map((v, i) => (
                <label key={v.size} className="rounded-xl bg-canvas p-2 ring-1 ring-line">
                  <span className="block text-center text-xs font-bold text-brand-700">{v.size}</span>
                  <input
                    type="number"
                    min={0}
                    className="input mt-1 text-center"
                    value={v.stock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, variants: f.variants.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)) }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-canvas p-3 ring-1 ring-line sm:col-span-2">
            <div>
              <p className="text-sm font-semibold">Visible in shop</p>
              <p className="text-xs text-muted">Hidden products can't be ordered.</p>
            </div>
            <Toggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Visible in shop" />
          </div>
        </form>
      )}
    </Modal>
  )
}

// PATCH /products/:id/stock — sets absolute stock per size. Mounted only while open.
export function StockModal({ product, onClose, onSaved }) {
  const toast = useToast()
  const [stock, setStock] = useState(() =>
    Object.fromEntries(SIZES.map((s) => [s, product.variants.find((v) => v.size === s)?.stock ?? 0])),
  )
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const res = await productsApi.updateStock(
        product._id,
        SIZES.map((size) => ({ size, stock: Math.max(0, Number(stock[size]) || 0) })),
      )
      toast.success(res.message)
      onSaved(res.data)
      onClose()
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Update stock"
      subtitle={`${product.name} ${product.color ? `· ${product.color}` : ''}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save stock'}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        {SIZES.map((size) => (
          <div key={size} className="flex items-center gap-3 rounded-xl bg-canvas p-2 ring-1 ring-line">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">{size}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setStock((s) => ({ ...s, [size]: Math.max(0, (Number(s[size]) || 0) - 1) }))}>
              <Icon name="minus" className="size-3.5" />
            </button>
            <input
              type="number"
              min={0}
              className="input flex-1 text-center"
              value={stock[size] ?? 0}
              onChange={(e) => setStock((s) => ({ ...s, [size]: e.target.value }))}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => setStock((s) => ({ ...s, [size]: (Number(s[size]) || 0) + 1 }))}>
              <Icon name="plus" className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// POST/DELETE /products/:id/images
export function ImagesModal({ open, product, onClose, onSaved }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState('')

  if (!product) return null

  const upload = async (files) => {
    if (!files.length) return
    setBusy('upload')
    try {
      const res = await productsApi.uploadImages(product._id, [...files].slice(0, 6))
      toast.success(res.message)
      onSaved(res.data)
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async (url) => {
    setBusy(url)
    try {
      const res = await productsApi.removeImage(product._id, url)
      toast.success(res.message)
      onSaved(res.data)
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy('')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Product images" subtitle={product.name} size="lg">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => (e.preventDefault(), upload(e.dataTransfer.files))}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-linear-to-br from-blush-50/60 to-brand-50/60 px-6 py-8 text-center transition hover:border-brand-400"
      >
        {busy === 'upload' ? <Spinner className="size-7" /> : <Icon name="upload" className="size-7 text-brand-500" />}
        <p className="mt-2 text-sm font-semibold text-ink">Click or drop images here</p>
        <p className="text-xs text-muted">JPG, PNG or WEBP · up to 6 at a time · max 3 MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {product.images.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {product.images.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-canvas ring-1 ring-line">
              <img src={assetUrl(url)} alt="" className="size-full object-cover" />
              <button
                onClick={() => remove(url)}
                disabled={busy === url}
                className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg bg-white/90 text-blush-600 opacity-0 shadow transition group-hover:opacity-100 hover:bg-blush-50 focus:opacity-100"
                aria-label="Remove image"
              >
                {busy === url ? <Spinner className="size-4" /> : <Icon name="trash" className="size-4" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-muted">No uploaded images yet.</p>
      )}
    </Modal>
  )
}
