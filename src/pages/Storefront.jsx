import { useState } from 'react'
import { productsApi } from '../api/endpoints'
import { assetUrl } from '../api/client'
import { useApi } from '../hooks/useApi'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { PageHeader } from '../components/ui/Common'
import { EmptyState, ErrorState, PageLoader, Spinner } from '../components/ui/Feedback'
import { money } from '../utils/format'

// Public product endpoints — what customers get from GET /api/products (no stock numbers).
export default function Storefront() {
  const { data, error, reload } = useApi(() => productsApi.listPublic(), [])
  const [slug, setSlug] = useState(null)
  const detail = useApi(() => (slug ? productsApi.getPublic(slug) : Promise.resolve({ data: null })), [slug])

  return (
    <>
      <PageHeader
        title="Storefront preview"
        subtitle="Exactly what the public shop API returns: visible products, sizes shown as in or out of stock."
        actions={
          <button className="btn btn-ghost" onClick={reload}>
            <Icon name="refresh" className="size-4" /> Refresh
          </button>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <PageLoader />
      ) : data.length === 0 ? (
        <div className="card">
          <EmptyState icon="store" title="The shop is empty" message="No visible products. Turn one on in Products." />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((p) => (
            <button key={p.slug} onClick={() => setSlug(p.slug)} className="card group overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-square bg-linear-to-br from-blush-50 to-brand-50">
                {p.images?.[0] ? (
                  <img
                    src={assetUrl(p.images[0])}
                    alt={p.name}
                    className="size-full object-cover transition group-hover:scale-105"
                    style={{ objectPosition: p.imagePosition || 'center' }}
                  />
                ) : (
                  <div className="grid size-full place-items-center text-brand-300">
                    <Icon name="products" className="size-14" strokeWidth={1.25} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-bold text-ink">{p.name}</p>
                <p className="text-xs text-muted">{p.color}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-blush-500">{money(p.price)}</span>
                  <div className="flex gap-1">
                    {p.variants.map((v) => (
                      <span
                        key={v.size}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${v.inStock ? 'bg-brand-50 text-brand-700' : 'bg-canvas text-muted line-through'}`}
                      >
                        {v.size}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={Boolean(slug)} onClose={() => setSlug(null)} title={detail.data?.name || 'Product'} subtitle={`GET /api/products/${slug}`}>
        {!detail.data ? (
          <div className="flex justify-center py-10">{detail.error ? <p className="text-sm text-blush-600">{detail.error.message}</p> : <Spinner className="size-7" />}</div>
        ) : (
          <div className="space-y-4">
            {detail.data.images?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {detail.data.images.map((url) => (
                  <img key={url} src={assetUrl(url)} alt="" className="aspect-square rounded-xl object-cover ring-1 ring-line" />
                ))}
              </div>
            )}
            <p className="text-sm text-muted">{detail.data.description || 'No description.'}</p>
            <pre className="max-h-64 overflow-auto rounded-xl bg-brand-900 p-4 text-xs text-brand-100">{JSON.stringify(detail.data, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </>
  )
}
