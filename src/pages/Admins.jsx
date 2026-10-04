import { useState } from 'react'
import { adminsApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { Avatar, Field, PageHeader, Toggle } from '../components/ui/Common'
import { Badge } from '../components/ui/Badge'
import { ErrorState, PageLoader } from '../components/ui/Feedback'
import { ROLES } from '../utils/constants'
import { capitalize, timeAgo } from '../utils/format'

// Registered through the sign-up page and never approved (never signed in).
const isPending = (a) => !a.isActive && !a.lastLoginAt

export default function Admins() {
  const { admin: me } = useAuth()
  const toast = useToast()
  const { data, error, reload, setData } = useApi(() => adminsApi.list(), [])
  const [modal, setModal] = useState(null) // { mode: 'create' | 'edit', admin? }
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState('')
  const [formError, setFormError] = useState('')

  const replace = (a) => setData((list) => (list.some((x) => x._id === a._id) ? list.map((x) => (x._id === a._id ? a : x)) : [...list, a]))

  const open = (mode, admin) => {
    setFormError('')
    setForm(mode === 'create' ? { name: '', email: '', password: '', role: 'admin' } : { name: admin.name, role: admin.role, password: '' })
    setModal({ mode, admin })
  }

  const submit = async (e) => {
    e.preventDefault()
    setFormError('')
    setBusy('form')
    try {
      const payload = { ...form }
      if (modal.mode === 'edit' && !payload.password) delete payload.password
      const res = modal.mode === 'create' ? await adminsApi.create(payload) : await adminsApi.update(modal.admin._id, payload)
      replace(res.data)
      toast.success(res.message)
      setModal(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy('')
    }
  }

  const toggleActive = async (a, isActive) => {
    setBusy(a._id)
    try {
      const res = await adminsApi.update(a._id, { isActive })
      replace(res.data)
      toast.success(isActive ? (isPending(a) ? `${a.name} approved, they can sign in now` : `${a.name} enabled`) : `${a.name} disabled`)
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <PageHeader
        title="Admins"
        subtitle="Who can sign in to this dashboard. New sign-ups wait here until you approve them."
        actions={
          <button className="btn btn-primary" onClick={() => open('create')}>
            <Icon name="plus" className="size-4" /> Add admin
          </button>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <PageLoader />
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Role</th>
                  <th>Last login</th>
                  <th>Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...data].sort((a, b) => isPending(b) - isPending(a)).map((a) => {
                  const isMe = a._id === me?._id
                  const pending = isPending(a)
                  return (
                    <tr key={a._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={a.name} />
                          <div>
                            <p className="font-semibold">
                              {a.name} {isMe && <span className="text-xs font-normal text-muted">(you)</span>}
                            </p>
                            <p className="text-xs text-muted">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {pending ? (
                          <Badge className="bg-amber-50 text-amber-700 ring-amber-200">Pending approval</Badge>
                        ) : (
                          <Badge className={a.role === 'superadmin' ? 'bg-blush-50 text-blush-700 ring-blush-200' : 'bg-brand-50 text-brand-700 ring-brand-200'}>
                            {capitalize(a.role)}
                          </Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {a.lastLoginAt ? timeAgo(a.lastLoginAt) : pending ? `Registered ${timeAgo(a.createdAt)}` : 'Never'}
                      </td>
                      <td>
                        {pending ? (
                          <button className="btn btn-primary btn-sm" disabled={busy === a._id} onClick={() => toggleActive(a, true)}>
                            <Icon name="check" className="size-3.5" /> Approve
                          </button>
                        ) : (
                          <Toggle checked={a.isActive} disabled={isMe || busy === a._id} onChange={(v) => toggleActive(a, v)} label="Active" />
                        )}
                      </td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-sm" onClick={() => open('edit', a)}>
                          <Icon name="edit" className="size-3.5" /> Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        size="sm"
        title={modal?.mode === 'create' ? 'Add admin' : `Edit ${modal?.admin?.name}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" form="admin-form" disabled={busy === 'form'}>
              {busy === 'form' ? 'Saving…' : modal?.mode === 'create' ? 'Create' : 'Save'}
            </button>
          </>
        }
      >
        <form id="admin-form" onSubmit={submit} className="space-y-4">
          {formError && <p className="rounded-xl bg-blush-50 p-3 text-sm text-blush-700 ring-1 ring-blush-200">{formError}</p>}
          <Field label="Name">
            <input className="input" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          {modal?.mode === 'create' && (
            <Field label="Email">
              <input type="email" className="input" required value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          )}
          <Field label={modal?.mode === 'create' ? 'Password' : 'New password'} hint={modal?.mode === 'edit' ? 'Leave empty to keep the current password' : 'At least 8 characters'}>
            <input
              type="password"
              className="input"
              minLength={8}
              required={modal?.mode === 'create'}
              autoComplete="new-password"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <select
              className="input"
              value={form.role || 'admin'}
              disabled={modal?.admin?._id === me?._id}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {capitalize(r)}
                </option>
              ))}
            </select>
          </Field>
        </form>
      </Modal>
    </>
  )
}
