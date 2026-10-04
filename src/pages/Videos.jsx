import { useState } from 'react'
import { videosApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import Icon from '../components/ui/Icon'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import { Field, PageHeader, Toggle } from '../components/ui/Common'
import { Badge } from '../components/ui/Badge'
import { EmptyState, ErrorState, PageLoader, Spinner } from '../components/ui/Feedback'
import { timeAgo } from '../utils/format'

// Same rules as server/utils/youtube.js — only used for the live preview; the server re-checks.
function youTubeId(url) {
  const s = url.trim()
  return s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/)?.[1] ?? (/^[\w-]{11}$/.test(s) ? s : null)
}

const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

function AddVideo({ onAdded }) {
  const toast = useToast()
  const [form, setForm] = useState({ url: '', title: '' })
  const [busy, setBusy] = useState(false)
  const id = youTubeId(form.url)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await videosApi.create({ url: form.url, title: form.title })
      toast.success(res.message)
      onAdded(res.data)
      setForm({ url: '', title: '' })
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mb-6 flex flex-col gap-5 p-5 md:flex-row">
      <div className="flex-1 space-y-4">
        <h2 className="flex items-center gap-2 font-bold text-ink">
          <Icon name="plus" className="size-5 text-brand-500" /> Add a YouTube video
        </h2>
        <Field label="YouTube link" hint="Upload the video to your YouTube channel first, then paste its link. Shorts links work too.">
          <input
            className="input"
            required
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://youtu.be/… or https://youtube.com/shorts/…"
          />
        </Field>
        <Field label="Title (optional)" hint="Shown to admins and used as the player's label in the shop.">
          <input className="input" maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <button className="btn btn-primary" disabled={busy || !id}>
          {busy ? <Spinner className="size-4 border-white/40 border-t-white" /> : <Icon name="plus" className="size-4" />} Add video
        </button>
        {form.url && !id && <p className="text-sm text-blush-600">That doesn’t look like a YouTube link.</p>}
      </div>
      {id && (
        <div className="w-full max-w-xs self-center md:w-64">
          <p className="label">Preview</p>
          <img src={thumb(id)} alt="" className="aspect-video w-full rounded-xl object-cover ring-1 ring-line" />
        </div>
      )}
    </form>
  )
}

export default function Videos() {
  const toast = useToast()
  const { data, error, reload, setData } = useApi(() => videosApi.listAll(), [])
  const [busy, setBusy] = useState('')
  const [editFor, setEditFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)

  const replace = (v) => setData((list) => list.map((x) => (x._id === v._id ? v : x)))

  const run = async (key, fn) => {
    setBusy(key)
    try {
      const res = await fn()
      toast.success(res.message)
      return res
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy('')
    }
  }

  const move = async (index, delta) => {
    const ids = data.map((v) => v._id)
    ;[ids[index], ids[index + delta]] = [ids[index + delta], ids[index]]
    const res = await run('order', () => videosApi.reorder(ids))
    if (res) setData(res.data)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    const res = await run('edit', () => videosApi.update(editFor._id, { title: editFor.title, url: editFor.url }))
    if (res) {
      replace(res.data)
      setEditFor(null)
    }
  }

  const firstLive = data?.find((v) => v.isActive)?._id

  return (
    <>
      <PageHeader
        title="Videos"
        subtitle="YouTube videos on the shop page. The first visible video plays at the top; the rest are shown below it."
        actions={
          <button className="btn btn-ghost" onClick={reload}>
            <Icon name="refresh" className="size-4" /> Refresh
          </button>
        }
      />

      <AddVideo onAdded={(v) => setData((list) => [...(list || []), v])} />

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <PageLoader />
      ) : data.length === 0 ? (
        <div className="card">
          <EmptyState icon="video" title="No videos yet" message="Add a YouTube link above and it appears in the shop." />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((v, i) => (
            <article key={v._id} className={`card flex flex-col overflow-hidden ${v.isActive ? '' : 'opacity-75'}`}>
              <a href={v.url} target="_blank" rel="noreferrer" className="group relative block aspect-video bg-canvas">
                <img src={thumb(v.youtubeId)} alt="" className="size-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25">
                  <span className="grid size-12 place-items-center rounded-full bg-white/90 text-blush-600 opacity-0 shadow transition group-hover:opacity-100">
                    <Icon name="video" className="size-6" />
                  </span>
                </span>
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {v._id === firstLive && <Badge className="bg-white/90 text-brand-700 ring-brand-200">Plays at top</Badge>}
                  {!v.isActive && <Badge className="bg-white/90 text-blush-700 ring-blush-200">Hidden</Badge>}
                  {v.isShort && <Badge className="bg-white/90 text-slate-700 ring-slate-200">Short</Badge>}
                </div>
              </a>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 font-bold text-ink">{v.title || 'Untitled video'}</h3>
                <p className="truncate font-mono text-xs text-muted">{v.url}</p>
                <p className="mt-1 text-xs text-muted">Added {timeAgo(v.createdAt)}</p>
                <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
                  <Toggle
                    checked={v.isActive}
                    disabled={busy === v._id}
                    label="Visible in shop"
                    onChange={async (isActive) => {
                      const res = await run(v._id, () => videosApi.update(v._id, { isActive }))
                      if (res) replace(res.data)
                    }}
                  />
                  <div className="ml-auto flex gap-1.5">
                    <button className="btn btn-ghost btn-sm" disabled={i === 0 || busy === 'order'} onClick={() => move(i, -1)} aria-label="Move up">
                      <Icon name="arrowUp" className="size-3.5" />
                    </button>
                    <button className="btn btn-ghost btn-sm" disabled={i === data.length - 1 || busy === 'order'} onClick={() => move(i, 1)} aria-label="Move down">
                      <Icon name="arrowDown" className="size-3.5" />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditFor({ ...v })} aria-label="Edit">
                      <Icon name="edit" className="size-3.5" />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteFor(v)} aria-label="Delete">
                      <Icon name="trash" className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editFor)}
        onClose={() => setEditFor(null)}
        title="Edit video"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEditFor(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" form="video-form" disabled={busy === 'edit'}>
              {busy === 'edit' ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {editFor && (
          <form id="video-form" onSubmit={saveEdit} className="space-y-4">
            <Field label="YouTube link">
              <input className="input" required value={editFor.url} onChange={(e) => setEditFor({ ...editFor, url: e.target.value })} />
            </Field>
            <Field label="Title">
              <input className="input" maxLength={150} value={editFor.title} onChange={(e) => setEditFor({ ...editFor, title: e.target.value })} />
            </Field>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(deleteFor)}
        onClose={() => setDeleteFor(null)}
        busy={busy === 'delete'}
        danger
        title="Delete this video?"
        message="It is removed from the shop. The video stays on YouTube."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (await run('delete', () => videosApi.remove(deleteFor._id))) {
            setData((list) => list.filter((x) => x._id !== deleteFor._id))
            setDeleteFor(null)
          }
        }}
      />
    </>
  )
}
