import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/ui/Icon'
import { Spinner } from '../components/ui/Feedback'

// Public sign-up. New accounts are disabled until a superadmin approves them on the Admins page.
export default function Register() {
  const { admin } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')

  if (admin) return <Navigate to="/" replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError("Passwords don't match")
    setBusy(true)
    try {
      const { message } = await authApi.register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      setDone(message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-white to-blush-50/50 p-6">
      <div className="w-full max-w-sm">
        <span className="mb-8 grid size-12 place-items-center rounded-2xl bg-linear-to-br from-blush-400 to-brand-600 font-extrabold text-white shadow-lg shadow-brand-500/30">
          MS
        </span>

        {done ? (
          <>
            <div className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <Icon name="check" className="size-6" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">Account created</h2>
            <p className="mt-2 text-sm text-muted">{done}</p>
            <p className="mt-2 text-sm text-muted">Once it's approved, sign in with {form.email.trim()}.</p>
            <Link to="/login" className="btn btn-primary mt-6 w-full py-3">
              <Icon name="key" className="size-4" /> Go to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Create an admin account</h2>
            <p className="mt-1 text-sm text-muted">A superadmin approves new accounts before they can sign in.</p>

            {error && (
              <div className="mt-6 flex items-start gap-2 rounded-xl bg-blush-50 p-3 text-sm text-blush-700 ring-1 ring-blush-200">
                <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            <label className="mt-6 block">
              <span className="label">Name</span>
              <input required minLength={2} maxLength={80} autoComplete="name" className="input" value={form.name} onChange={set('name')} />
            </label>
            <label className="mt-4 block">
              <span className="label">Email</span>
              <input type="email" required autoComplete="email" className="input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </label>
            <label className="mt-4 block">
              <span className="label">Password</span>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input pr-10"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-brand-600"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  <Icon name={show ? 'eyeOff' : 'eye'} className="size-4" />
                </button>
              </div>
            </label>
            <label className="mt-4 block">
              <span className="label">Confirm password</span>
              <input type={show ? 'text' : 'password'} required minLength={8} autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} />
            </label>

            <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full py-3">
              {busy ? <Spinner className="size-4 border-white/40 border-t-white" /> : <Icon name="plus" className="size-4" />}
              {busy ? 'Creating account…' : 'Register'}
            </button>
            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:text-blush-500">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
