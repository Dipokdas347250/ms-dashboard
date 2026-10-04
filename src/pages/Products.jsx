import { useState } from 'react'
import { productsApi } from '../api/endpoints'
import { assetUrl } from '../api/client'
import { useApi, useDebounced } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import Icon from '../components/ui/Icon'
import { ConfirmModal } from '../components/ui/Modal'
import { PageHeader, SearchInput, Toggle } from '../components/ui/Common'
import { Badge } from '../components/ui/Badge'
import { EmptyState, ErrorState, PageLoader } from '../components/ui/Feedback'
import { ImagesModal, ProductFormModal, StockModal } from '../components/products/ProductModals'
import { SIZES } from '../utils/constants'
import { money, num } from '../utils/format'

function stockTone(stock) {
  if (stock === 0) return 'bg-blush-100 text-blush-700'
  if (stock <= 5) return 'bg-amber-50 text-amber-700'
  return 'bg-brand-50 text-brand-700'
}

export default function Products() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [active, setActive] = useState('')
  const debouncedQ = useDebounced(q)
  const { data, error, reload, setData } = useApi(() => productsApi.listAll({ q: debouncedQ, active }), [debouncedQ, active])

  const [formFor, setFormFor] = useState(undefined) // undefined = closed, null = new, object = edit
  const [stockFor, setStockFor] = useState(null)
  const [imagesFor, setImagesFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)
  const [busy, setBusy] = useState('')

  // Merge a saved product back into the list without refetching.
  const replace = (p) => {
    setData((list) => (list?.some((x) => x._id === p._id) ? list.map((x) => (x._id === p._id ? p : x)) : [...(list || []), p]))
    if (imagesFor?._id === p._id) setImagesFor(p)
  }

  const toggleActive = async (p, isActive) => {
    setBusy(p._id)
    try {
      const res = await productsApi.update(p._id, { isActive })
      replace(res.data)
      toast.success(isActive ? `${p.name} is visible in the shop` : `${p.name} is hidden`)
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy('')
    }
  }

  const confirmDelete = async () => {
    setBusy('delete')
    try {
      const res = await productsApi.remove(deleteFor._id)
      toast.success(res.message)
      if (res.data) replace(res.data)
      else setData((list) => list.filter((x) => x._id !== deleteFor._id))
      setDeleteFor(null)
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Prices, stock, images and what's visible in the shop."
        actions={
          <button className="btn btn-primary" onClick={() => setFormFor(null)}>
            <Icon name="plus" className="size-4" /> New product
          </button>
        }
      />

      <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, slug, color…" className="flex-1" />
        <div className="flex rounded-xl bg-canvas p-1 ring-1 ring-line">
          {[
            ['', 'All'],
            ['true', 'Visible'],
            ['false', 'Hidden'],
          ].map(([v, label]) => (
            <button
              key={label}
              onClick={() => setActive(v)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${active === v ? 'bg-white text-brand-700 shadow-sm' : 'text-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <PageLoader />
      ) : data.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="products"
            title="No products"
            message={q || active ? 'Nothing matches this filter.' : 'Add your first product to get started.'}
            action={
              <button className="btn btn-primary" onClick={() => setFormFor(null)}>
                <Icon name="plus" className="size-4" /> New product
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <article key={p._id} className={`card flex flex-col overflow-hidden transition hover:-translate-y-0.5 ${!p.isActive ? 'opacity-75' : ''}`}>
              <div className="relative aspect-4/3 bg-linear-to-br from-blush-50 to-brand-50">
                {p.images?.[0] ? (
                  <img src={assetUrl(p.images[0])} alt={p.name} className="size-full object-cover" style={{ objectPosition: p.imagePosition || 'center' }} />
                ) : (
                  <div className="grid size-full place-items-center text-brand-300">
                    <Icon name="image" className="size-12" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {p.isActive ? (
                    <Badge className="bg-white/90 text-emerald-700 ring-emerald-200">Visible</Badge>
                  ) : (
                    <Badge className="bg-white/90 text-blush-700 ring-blush-200">Hidden</Badge>
                  )}
                </div>
                <button
                  onClick={() => setImagesFor(p)}
                  className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-brand-700 shadow hover:bg-white"
                >
                  <Icon name="image" className="size-3.5" /> {p.images?.length || 0}
                </button>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-ink">{p.name}</h3>
                    <p className="truncate text-xs text-muted">
                      {p.color || '—'} · <span className="font-mono">{p.slug}</span>
                    </p>
                  </div>
                  <p className="text-lg font-extrabold text-brand-700">{money(p.price)}</p>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {SIZES.map((size) => {
                    const stock = p.variants.find((v) => v.size === size)?.stock ?? 0
                    return (
                      <div key={size} className={`rounded-lg py-1.5 text-center ${stockTone(stock)}`}>
                        <p className="text-[10px] font-bold opacity-70">{size}</p>
                        <p className="text-sm font-bold">{num(stock)}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-muted">Total stock: {num(p.totalStock)}</p>

                <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                  <Toggle checked={p.isActive} disabled={busy === p._id} onChange={(v) => toggleActive(p, v)} label="Visible in shop" />
                  <div className="ml-auto flex gap-1.5">
                    <button className="btn btn-soft btn-sm" onClick={() => setStockFor(p)}>
                      <Icon name="box" className="size-3.5" /> Stock
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setFormFor(p)} aria-label="Edit">
                      <Icon name="edit" className="size-3.5" />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteFor(p)} aria-label="Delete">
                      <Icon name="trash" className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formFor !== undefined && <ProductFormModal product={formFor} onClose={() => setFormFor(undefined)} onSaved={replace} />}
      {stockFor && <StockModal product={stockFor} onClose={() => setStockFor(null)} onSaved={replace} />}
      <ImagesModal open={Boolean(imagesFor)} product={imagesFor} onClose={() => setImagesFor(null)} onSaved={replace} />
      <ConfirmModal
        open={Boolean(deleteFor)}
        onClose={() => setDeleteFor(null)}
        onConfirm={confirmDelete}
        busy={busy === 'delete'}
        danger
        title={`Delete ${deleteFor?.name}?`}
        message="If this product appears in any order it will be hidden instead of deleted, so order history stays intact."
        confirmLabel="Delete"
      />
    </>
  )
}
