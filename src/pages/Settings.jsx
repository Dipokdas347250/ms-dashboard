import { useState } from 'react'
import { authApi, settingsApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Icon from '../components/ui/Icon'
import { Avatar, Field, InfoRow, PageHeader } from '../components/ui/Common'
import { Badge } from '../components/ui/Badge'
import { Skeleton, Spinner } from '../components/ui/Feedback'
import { AREAS, COMBO_PRICE, COMBO_SIZE } from '../utils/constants'
import { capitalize, date, dateTime } from '../utils/format'

function ConnectedBadge({ on, label = 'Connected' }) {
  return on ? (
    <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">{label}</Badge>
  ) : (
    <Badge className="bg-slate-100 text-slate-600 ring-slate-200">Not set up</Badge>
  )
}

// Steadfast courier keys and the Meta Pixel. Secrets come back masked; an empty secret field keeps the saved value.
function Integrations() {
  const { isSuperadmin } = useAuth()
  const toast = useToast()
  const { data, error, setData } = useApi(() => settingsApi.get(), [])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState('')

  if (data && !form) {
    setForm({ apiKey: '', secretKey: '', pixelId: data.meta.pixelId, accessToken: '', testEventCode: data.meta.testEventCode })
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
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

  const save = async (key, payload) => {
    const res = await run(key, () => settingsApi.update(payload))
    if (res) {
      setData(res.data)
      setForm(null)
    }
  }

  const saveSteadfast = (e) => {
    e.preventDefault()
    const steadfast = {}
    if (form.apiKey.trim()) steadfast.apiKey = form.apiKey
    if (form.secretKey.trim()) steadfast.secretKey = form.secretKey
    if (!Object.keys(steadfast).length) return toast.error('Enter the API key and/or secret key')
    save('steadfast', { steadfast })
  }

  const saveMeta = (e) => {
    e.preventDefault()
    const meta = { pixelId: form.pixelId, testEventCode: form.testEventCode }
    if (form.accessToken.trim()) meta.accessToken = form.accessToken
    save('meta', { meta })
  }

  if (error) return <p className="card p-5 text-sm text-blush-600 lg:col-span-2">{error.message}</p>
  if (!data || !form) return <Skeleton className="h-64 w-full lg:col-span-2" />

  const readOnly = !isSuperadmin

  return (
    <>
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <Icon name="truck" className="size-5 text-brand-500" /> Steadfast courier
          </h2>
          <ConnectedBadge on={data.steadfast.connected} />
        </div>
        <p className="text-sm text-muted">
          From the Steadfast merchant panel → API. Orders sent from here are created as cash-on-delivery parcels.
        </p>
        <form onSubmit={saveSteadfast} className="mt-4 space-y-4">
          <Field label="API key" hint={data.steadfast.apiKey ? `Saved: ${data.steadfast.apiKey} · leave empty to keep` : undefined}>
            <input className="input font-mono" autoComplete="off" disabled={readOnly} value={form.apiKey} onChange={set('apiKey')} />
          </Field>
          <Field label="Secret key" hint={data.steadfast.secretKey ? `Saved: ${data.steadfast.secretKey} · leave empty to keep` : undefined}>
            <input type="password" className="input font-mono" autoComplete="new-password" disabled={readOnly} value={form.secretKey} onChange={set('secretKey')} />
          </Field>
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <button className="btn btn-primary" disabled={busy === 'steadfast'}>
                {busy === 'steadfast' ? 'Saving…' : 'Save keys'}
              </button>
            )}
            <button
              type="button"
              className="btn btn-soft"
              disabled={!data.steadfast.connected || busy === 'test'}
              onClick={() => run('test', settingsApi.testSteadfast)}
            >
              {busy === 'test' ? <Spinner className="size-4" /> : <Icon name="activity" className="size-4" />} Test connection
            </button>
          </div>
        </form>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <Icon name="activity" className="size-5 text-brand-500" /> Meta Pixel
          </h2>
          <ConnectedBadge on={Boolean(data.meta.pixelId)} label={data.meta.conversionsApi ? 'Pixel + Conversions API' : 'Pixel on'} />
        </div>
        <p className="text-sm text-muted">
          The shop loads this pixel and tracks PageView, AddToCart, InitiateCheckout and Purchase. Changes reach the shop within a minute.
        </p>
        <form onSubmit={saveMeta} className="mt-4 space-y-4">
          <Field label="Pixel ID" hint="Events Manager → Data sources → your pixel. Leave empty to turn the pixel off.">
            <input className="input font-mono" inputMode="numeric" disabled={readOnly} value={form.pixelId} onChange={set('pixelId')} placeholder="e.g. 123456789012345" />
          </Field>
          <Field
            label="Conversions API access token (optional)"
            hint={data.meta.accessToken ? `Saved: ${data.meta.accessToken} · leave empty to keep` : 'Also sends Purchase from the server, so ad blockers and iOS don’t hide sales.'}
          >
            <input type="password" className="input font-mono" autoComplete="new-password" disabled={readOnly} value={form.accessToken} onChange={set('accessToken')} />
          </Field>
          <Field label="Test event code (optional)" hint="Only while testing in Events Manager → Test events. Clear it when you go live.">
            <input className="input font-mono" disabled={readOnly} value={form.testEventCode} onChange={set('testEventCode')} placeholder="TEST12345" />
          </Field>
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <button className="btn btn-primary" disabled={busy === 'meta'}>
                {busy === 'meta' ? 'Saving…' : 'Save pixel'}
              </button>
            )}
            {!readOnly && data.meta.accessToken && (
              <button type="button" className="btn btn-danger" disabled={busy === 'meta'} onClick={() => save('meta', { meta: { accessToken: '' } })}>
                Remove token
              </button>
            )}
          </div>
        </form>
      </section>
      {readOnly && <p className="text-sm text-muted lg:col-span-2">Only a superadmin can change these keys.</p>}
    </>
  )
}

export default function Settings() {
  const { changePassword } = useAuth()
  const toast = useToast()
  // Fresh copy from GET /api/admin/me (last login etc.)
  const { data: me } = useApi(() => authApi.me(), [])
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.next !== form.confirm) return setError("New passwords don't match")
    setBusy(true)
    try {
      const res = await changePassword(form.current, form.next)
      toast.success(`${res.message}. Other sessions were signed out.`)
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account, courier, Meta Pixel and shop rules." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold text-ink">Profile</h2>
          {!me ? (
            <Skeleton className="mt-4 h-32 w-full" />
          ) : (
            <>
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-linear-to-br from-blush-50 to-brand-50 p-4">
                <Avatar name={me.name} className="size-14 text-lg" />
                <div>
                  <p className="font-bold text-ink">{me.name}</p>
                  <p className="text-sm text-muted">{me.email}</p>
                  <Badge className="mt-1 bg-white text-brand-700 ring-brand-200">{capitalize(me.role)}</Badge>
                </div>
              </div>
              <div className="mt-3 divide-y divide-line">
                <InfoRow label="Last login">{dateTime(me.lastLoginAt)}</InfoRow>
                <InfoRow label="Password changed">{me.passwordChangedAt ? dateTime(me.passwordChangedAt) : 'Never'}</InfoRow>
                <InfoRow label="Member since">{date(me.createdAt)}</InfoRow>
              </div>
            </>
          )}
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <Icon name="key" className="size-5 text-brand-500" /> Change password
          </h2>
          <p className="text-sm text-muted">Signs out every other device using this account.</p>
          <form onSubmit={submit} className="mt-4 space-y-4">
            {error && <p className="rounded-xl bg-blush-50 p-3 text-sm text-blush-700 ring-1 ring-blush-200">{error}</p>}
            <Field label="Current password">
              <input
                type="password"
                className="input"
                required
                autoComplete="current-password"
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" hint="At least 8 characters">
                <input
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.next}
                  onChange={(e) => setForm({ ...form, next: e.target.value })}
                />
              </Field>
              <Field label="Confirm">
                <input
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
              </Field>
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>

        <Integrations />

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-bold text-ink">Shop rules</h2>
          <p className="text-sm text-muted">
            Set on the server in <code>config/shop.js</code> and <code>.env</code>. Shown here for reference.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 p-4 text-white">
              <p className="text-xs font-semibold tracking-wide uppercase opacity-80">Combo</p>
              <p className="mt-1 text-2xl font-extrabold">
                {COMBO_SIZE} for ৳{COMBO_PRICE}
              </p>
            </div>
            {Object.values(AREAS).map((a) => (
              <div key={a.label} className="rounded-2xl bg-blush-50 p-4 ring-1 ring-blush-100">
                <p className="text-xs font-semibold tracking-wide text-blush-700 uppercase">{a.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">৳{a.fee}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
